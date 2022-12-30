import { basename, join } from 'path'
import fs from 'fs/promises'
import {
  asConcur,
  filter,
  flatMap,
  flatten,
  forEach,
  map,
  mapConcur,
  pipe,
  reduce,
  reduceConcur,
  toArray,
  toGrouped,
  toMap,
  toSet,
  values,
} from 'lfi'
import parseFrontMatter from 'gray-matter'
import { z } from 'zod'
import readingTime from 'reading-time'
import { selectAll } from 'hast-util-select'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ConcurIterable } from 'lfi'
import { Octokit } from 'octokit'
import type { Root } from 'hast'
import { findBestMatch } from 'string-similarity'
import assert from './assert.js'
import { cached } from './cache.server'
import renderHtml from './html.js'
import parseMarkdown from './markdown.server.js'

export const findBestMarkdownPostMatch = async (
  postId: string,
): Promise<MarkdownPost> => {
  const posts = await getMarkdownPosts()
  const postIds = [...posts.keys()]
  const { bestMatchIndex } = findBestMatch(postId.toLowerCase(), postIds)
  return posts.get(postIds[bestMatchIndex]!)!
}

export const getTags: () => Promise<Set<string>> = cached(
  async () =>
    new Set(
      pipe(
        await getPosts(),
        flatMap(([, { tags }]) => tags),
        reduce(toArray()),
      ).sort(),
    ),
)

export const getMarkdownPosts: () => Promise<Map<string, MarkdownPost>> =
  cached(async () =>
    pipe(
      await getPosts(),
      filter(
        (entry): entry is [string, MarkdownPost] =>
          entry[1].type === `markdown`,
      ),
      reduce(toMap()),
    ),
  )

export const getPosts: () => Promise<Map<string, Post>> = cached(async () => {
  const rawPosts = await (process.env.NODE_ENV === `production`
    ? getGitHubPosts
    : getLocalPosts)()

  const postEntries = await pipe(
    rawPosts,
    mapConcur(
      async (rawPost): Promise<[string, Post]> => [
        rawPost.id,
        await parseRawPost(rawPost),
      ],
    ),
    reduceConcur(toArray()),
  )

  const posts: Map<string, Post> = new Map(
    postEntries.sort(
      ([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime(),
    ),
  )

  pipe(
    posts,
    flatMap(([id, { references }]) =>
      pipe(
        values(references),
        flatten,
        map((reference): [string, string] => [id, reference]),
      ),
    ),
    forEach(([id, reference]) => posts.get(reference)?.referencedBy.add(id)),
  )

  return posts
})

const parseRawPost = async (rawPost: RawPost): Promise<Post> => {
  const { content, data } = parseFrontMatter(rawPost.content)
  return {
    id: rawPost.id,
    ...(content.trim().length > 0
      ? await parseRawMarkdownPost(content, data)
      : parseRawHrefPost(data)),
    referencedBy: new Set(),
  }
}

const parseRawMarkdownPost = async (
  content: string,
  metadata: Record<string, unknown>,
): Promise<Omit<MarkdownPost, `id` | `referencedBy`>> => {
  const htmlAst = await parseMarkdown(content)

  return {
    type: `markdown`,
    ...basePostMetadataSchema.parse(metadata),
    references: parseReferences(parseHrefs(htmlAst)),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    content: renderToStaticMarkup(renderHtml(htmlAst)),
  }
}

const parseRawHrefPost = (
  metadata: Record<string, unknown>,
): Omit<HrefPost, `id` | `referencedBy`> => {
  const { hrefs, ...rest } = hrefPostMetadataSchema.parse(metadata)
  return { type: `href`, ...rest, references: parseReferences(hrefs) }
}

export type Post = MarkdownPost | HrefPost

type MarkdownPost = BasePost & {
  type: `markdown`
  minutesToRead: number
  content: string
}

type HrefPost = BasePost & { type: `href`; href: string }

type BasePost = {
  id: string
  title: string
  tags: Set<string>
  timestamp: Date
  references: Map<string, Set<string>>
  referencedBy: Set<string>
}

const stringSetSchema = z
  .array(z.string())
  .refine(strings => new Set(strings).size === strings.length)
  .transform(strings => new Set(strings.sort()))

const basePostMetadataSchema = z.object({
  title: z.string(),
  tags: stringSetSchema,
  timestamp: z.preprocess(
    value => (typeof value === `string` ? new Date(value) : value),
    z.date(),
  ),
})

const hrefPostMetadataSchema = basePostMetadataSchema.extend({
  href: z.string(),
  hrefs: stringSetSchema,
})

const parseHrefs = (htmlAst: Root): Set<string> =>
  pipe(
    selectAll(`a`, htmlAst),
    flatMap(element => {
      const href = element.properties?.href
      return typeof href === `string` ? [href] : []
    }),
    reduce(toSet()),
  )

const parseReferences = (hrefs: Iterable<string>): Map<string, Set<string>> =>
  pipe(
    hrefs,
    filter(href => !href.startsWith(`#`)),
    map((href): [string, string] => [parseReference(href), href]),
    reduce(toGrouped(toSet(), toMap())),
  )

const parseReference = (href: string): string => {
  const url = new URL(href, `https://${HOSTNAME}`)

  if (url.hostname === HOSTNAME) {
    return removePrefix(url.pathname, `/`)
  }

  return removePrefix(url.hostname, `www.`)
}

const HOSTNAME = `tomeraberba.ch`

const removePrefix = (string: string, prefix: string): string =>
  string.startsWith(prefix) ? string.slice(prefix.length) : string

const getGitHubPosts = async (): Promise<ConcurIterable<RawPost>> =>
  pipe(
    asConcur(await getGitHubRepositoryDirectory(POSTS_PATH)),
    mapConcur(async ({ type, name, path }) => {
      assert(type === `file`, `Expected ${path} to be a file, but was: ${type}`)

      return {
        id: parseId(name),
        content: getFileContent(await getGitHubRepositoryFile(path)),
      }
    }),
  )

const getGitHubRepositoryDirectory = async (path: string) => {
  const response = await getGitHubRepositoryContents(path)
  const files = response.data

  assert(Array.isArray(files), `Expected ${path} to be a directory`)

  return files
}

const getGitHubRepositoryFile = async (path: string) => {
  const response = await getGitHubRepositoryContents(path)
  const file = response.data

  assert(
    !Array.isArray(file) && file.type === `file`,
    `Expected ${file} to be a file`,
  )

  return file
}

const getGitHubRepositoryContents = (path: string) =>
  new Octokit({ auth: process.env.GITHUB_TOKEN }).request(
    `GET /repos/{owner}/{repo}/contents/{path}`,
    {
      owner: `TomerAberbach`,
      repo: `website`,
      path,
    },
  )

const getFileContent = ({
  encoding,
  content,
}: {
  readonly encoding: string
  readonly content: string
}): string => {
  if (encoding !== `base64`) {
    return content
  }

  return Buffer.from(content, `base64`).toString(`utf8`)
}

const getLocalPosts = async (): Promise<ConcurIterable<RawPost>> => {
  const postsDirectory = join(process.cwd(), POSTS_PATH)

  return pipe(
    asConcur(await fs.readdir(postsDirectory)),
    mapConcur(async name => ({
      id: parseId(name),
      content: await fs.readFile(join(postsDirectory, name), `utf8`),
    })),
  )
}

type RawPost = { id: string; content: string }

const POSTS_PATH = `src/posts`

const parseId = (name: string): string => {
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
