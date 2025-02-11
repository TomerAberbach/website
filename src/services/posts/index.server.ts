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
  window,
} from 'lfi'
import { findBestMatch } from 'string-similarity'
import { includeKeys } from 'filter-obj'
import { readRawPosts } from './read.server.ts'
import parsePost from './parse/index.server.tsx'
import type { MarkdownPost, Post } from './types.ts'
import { cache } from '~/services/cache.server.ts'

export const findBestMarkdownPostMatch = async (
  postId: string,
): Promise<MarkdownPost> => {
  const posts = await getMarkdownPosts()
  const postIds = [...posts.keys()]
  const { bestMatchIndex } = findBestMatch(postId.toLowerCase(), postIds)
  return posts.get(postIds[bestMatchIndex]!)!
}

export const getTags: () => Promise<Set<string>> = cache(
  async () =>
    new Set(
      pipe(
        await getPosts(),
        flatMap(([, { tags }]) => tags),
        reduce(toArray()),
      ).sort(),
    ),
)

export const getMarkdownPosts: () => Promise<Map<string, MarkdownPost>> = cache(
  async () =>
    pipe(
      await getPosts(),
      filter(
        (entry): entry is [string, MarkdownPost] =>
          entry[1].type === `markdown`,
      ),
      reduce(toMap()),
    ),
)

export const getPosts: () => Promise<Map<string, Post>> = cache(async () => {
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

  const posts = new Map<string, Post>(
    postEntries.sort(
      ([, a], [, b]) =>
        b.dates.published.getTime() - a.dates.published.getTime(),
    ),
  )

  pipe(
    values(posts),
    filter((post): post is MarkdownPost => post.type === `markdown`),
    window(3),
    forEach(([nextPost, post, previousPost]) => {
      nextPost!.previousPost = includeKeys(post!, [`id`, `title`])
      post!.nextPost = includeKeys(nextPost!, [`id`, `title`])
      post!.previousPost = includeKeys(previousPost!, [`id`, `title`])
      previousPost!.nextPost = includeKeys(post!, [`id`, `title`])
    }),
  )

  pipe(
    posts,
    flatMap(([id, { references }]) =>
      pipe(
        values(references),
        flatten,
        map(reference => [id, reference]),
      ),
    ),
    filter(([, reference]) => reference.startsWith(`/`)),
    forEach(([id, reference]) =>
      posts.get(reference.slice(1))?.referencedBy.set(id, posts.get(id)!.title),
    ),
  )

  for (const post of posts.values()) {
    post.referencedBy = new Map(
      [...post.referencedBy].sort(
        ([a], [b]) =>
          (posts.get(b)?.dates.published.getTime() ?? 0) -
          (posts.get(a)?.dates.published.getTime() ?? 0),
      ),
    )
  }

  return posts
})
