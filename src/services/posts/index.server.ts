import {
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
  toMap,
  values,
} from 'lfi'
import { findBestMatch } from 'string-similarity'
import { readRawPosts } from './read.server.js'
import parsePost from './parse/index.server.js'
import type { MarkdownPost, Post } from './types.js'
import { cached } from '~/services/cache.server'

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
  const postEntries = await pipe(
    await readRawPosts(),
    mapConcur(
      async (rawPost): Promise<[string, Post]> => [
        rawPost.id,
        await parsePost(rawPost),
      ],
    ),
    reduceConcur(toArray()),
  )

  const posts: Map<string, Post> = new Map(
    postEntries.sort(
      ([, a], [, b]) =>
        b.dates.published.getTime() - a.dates.published.getTime(),
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
