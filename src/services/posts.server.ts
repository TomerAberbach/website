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
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import { unified } from 'unified'
import { getHighlighter } from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import renderHtml from './html'
import { cached } from './cache.server'
import assert from './assert'

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

async function parseRawPost(rawPost: RawPost): Promise<Post> {
  const { content, data } = parseFrontMatter(rawPost.content)
  const htmlAst = await parseMarkdown(content)

  return {
    id: rawPost.id,
    ...postMetadataSchema.parse(data),
    references: parseReferences(parseHrefs(htmlAst)),
    referencedBy: new Set(),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    content: renderToStaticMarkup(renderHtml(htmlAst)),
  }
}

export type Post = {
  id: string
  title: string
  tags: Set<string>
  timestamp: Date
  references: Map<string, Set<string>>
  referencedBy: Set<string>
  minutesToRead: number
  content: string
}

const parseMarkdown = async (markdown: string): Promise<Root> =>
  unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeExternalLinks)
    .use(rehypeShiki, { highlighter: await highlighterPromise })
    .use(rehypeRemoveShikiClasses)
    .use(rehypePresetMinify)
    .use(function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.Compiler = htmlAst => htmlAst
    })
    .processSync(markdown).result as Root

const highlighterPromise = getHighlighter({ theme: `material-palenight` })

const rehypeRemoveShikiClasses = () => (tree: Root) => {
  visit(tree, { tagName: `pre` }, node => {
    const stack = [node]
    do {
      const node = stack.pop()!
      delete node.properties?.className

      for (const child of node.children) {
        if (child.type === `element`) {
          stack.push(child)
        }
      }
    } while (stack.length > 0)
  })

  return tree
}

const postMetadataSchema = z.object({
  title: z.string(),
  tags: z
    .array(z.string())
    .refine(tags => new Set(tags).size === tags.length)
    .transform(tags => new Set(tags.sort())),
  timestamp: z.preprocess(
    value => (typeof value === `string` ? new Date(value) : value),
    z.date(),
  ),
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

function parseReference(href: string): string {
  const url = new URL(href, `https://${HOSTNAME}`)

  if (url.hostname === HOSTNAME) {
    return removePrefix(url.pathname, `/`)
  }

  return removePrefix(url.hostname, `www.`)
}

const HOSTNAME = `tomeraberba.ch`

const removePrefix = (string: string, prefix: string): string =>
  string.startsWith(prefix) ? string.substring(prefix.length) : string

async function getGitHubPosts(): Promise<ConcurIterable<RawPost>> {
  const files = await getGitHubRepositoryDirectory(POSTS_PATH)

  return pipe(
    asConcur(files),
    mapConcur(async ({ type, name, path }) => {
      assert(type === `file`, `Expected ${path} to be a file, but was: ${type}`)

      return {
        id: parseId(name),
        content: getFileContent(await getGitHubRepositoryFile(path)),
      }
    }),
  )
}

async function getGitHubRepositoryDirectory(path: string) {
  const response = await getGitHubRepositoryContents(path)
  const files = response.data

  assert(Array.isArray(files), `Expected ${path} to be a directory`)

  return files
}

async function getGitHubRepositoryFile(path: string) {
  const response = await getGitHubRepositoryContents(path)
  const file = response.data

  assert(
    !Array.isArray(file) && file.type === `file`,
    `Expected ${file} to be a file`,
  )

  return file
}

function getGitHubRepositoryContents(path: string) {
  return new Octokit({ auth: process.env.GITHUB_TOKEN }).request(
    `GET /repos/{owner}/{repo}/contents/{path}`,
    {
      owner: `TomerAberbach`,
      repo: `website`,
      path,
    },
  )
}

function getFileContent({
  encoding,
  content,
}: {
  readonly encoding: string
  readonly content: string
}): string {
  if (encoding !== `base64`) {
    return content
  }

  return Buffer.from(content, `base64`).toString(`utf8`)
}

async function getLocalPosts(): Promise<ConcurIterable<RawPost>> {
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

function parseId(name: string) {
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
