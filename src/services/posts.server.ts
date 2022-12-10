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
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkSmartypants from 'remark-smartypants'
import { h } from 'hastscript'
import { toString } from 'hast-util-to-string'
import assert from './assert.js'
import { cached } from './cache.server'
import renderHtml from './html.js'

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

const parseRawPost = async (rawPost: RawPost): Promise<Post> => {
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
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkSmartypants)
      .use(remarkA11yEmoji)
      .use(remarkEmbedder, { transformers: [remarkTransformerOembed] })
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeExternalLinks)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: `prepend`,
        properties: {},
        content: node =>
          h(`img`, {
            alt: `${toString(node)} permalink`,
            src: `/link.svg`,
            class: `m-0`,
          }),
      })
      .use(rehypeShiki, { highlighter: await highlighterPromise })
      .use(() => rehypeRemoveShikiClasses)
      .use(rehypeKatex)
      .use(rehypePresetMinify)
      // eslint-disable-next-line no-restricted-syntax
      .use(function () {
        // eslint-disable-next-line typescript/no-invalid-this
        this.Compiler = htmlAst => htmlAst
      })
      .process(markdown)
  ).result as Root

const highlighterPromise = getHighlighter({ theme: `material-palenight` })

const rehypeRemoveShikiClasses = (tree: Root) => {
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
