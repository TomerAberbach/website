import {
  flatMap,
  forEach,
  map,
  mapConcur,
  pipe,
  reduceConcur,
  toArray,
} from 'lfi'
import parseFrontMatter from 'gray-matter'
import { z } from 'zod'
import readingTime from 'reading-time'
import { selectAll } from 'hast-util-select'
import { renderToStaticMarkup } from 'react-dom/server'
import { cached } from '../cache.server.js'
import renderHtml from '../html'
import queryRawPosts from './query.server.js'
import type { RawPost } from './query.server.js'
import parseReferences from './references.server'
import parseMarkdown from './markdown.server'

export const getPosts: () => Promise<Map<string, Post>> = cached(async () => {
  const postEntries = await pipe(
    await queryRawPosts(),
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
      map(reference => [id, reference], references),
    ),
    forEach(([id, reference]) => posts.get(reference)?.referencedBy.add(id)),
  )

  return posts
})

async function parseRawPost(rawPost: RawPost): Promise<Post> {
  const { content, data } = parseFrontMatter(rawPost.content)
  const htmlAst = await parseMarkdown(content)
  const hrefs = selectAll(`a`, htmlAst).flatMap(element => {
    const href = element.properties?.href
    return typeof href === `string` ? [href] : []
  })

  return {
    id: rawPost.id,
    ...postMetadataSchema.parse(data),
    references: parseReferences(hrefs),
    referencedBy: new Set(),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    content: renderToStaticMarkup(renderHtml(htmlAst)),
  }
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

export type Post = {
  id: string
  title: string
  tags: Set<string>
  timestamp: Date
  references: Set<string>
  referencedBy: Set<string>
  minutesToRead: number
  content: string
}
