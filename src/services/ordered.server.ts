// eslint-disable-next-line depend/ban-dependencies
import { includeKeys } from 'filter-obj'
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
  toMap,
  values,
  window,
} from 'lfi'
import type { Simplify } from 'type-fest'
import { cache } from './cache.server.ts'
import { getPostKeys } from './post-keys.server.ts'
import { getPost } from './post.server.ts'
import type { MarkdownPost, Post } from './post.server.ts'

export const getOrderedMarkdownPosts = async (): Promise<
  Map<string, Ordered<MarkdownPost>>
> =>
  pipe(
    await getOrderedPosts(),
    filter(
      (postEntry): postEntry is [string, Ordered<MarkdownPost>] =>
        postEntry[1].type === `markdown`,
    ),
    reduce(toMap()),
  )

export const getOrderedPosts: () => Promise<Map<string, Ordered<Post>>> = cache(
  async () => {
    const posts: Ordered<Post>[] = (
      await pipe(
        asConcur(await getPostKeys()),
        mapConcur(([, key]) => getPost(key)),
        reduceConcur(toArray()),
      )
    ).sort((a, b) => b.dates.published.getTime() - a.dates.published.getTime())

    pipe(
      posts,
      filter(post => post.type === `markdown`),
      window(3),
      forEach(([nextPost, post, previousPost]) => {
        nextPost!.previous = includeKeys(post!, [`id`, `title`])
        post!.next = includeKeys(nextPost!, [`id`, `title`])
        post!.previous = includeKeys(previousPost!, [`id`, `title`])
        previousPost!.next = includeKeys(post!, [`id`, `title`])
      }),
    )

    const postById = pipe(
      posts,
      map(post => [post.id, post]),
      reduce(toMap()),
    )
    pipe(
      posts,
      flatMap(({ id, references }) =>
        pipe(
          values(references),
          flatten,
          map(reference => [id, reference]),
        ),
      ),
      forEach(([id, reference]) =>
        postById
          .get(reference.startsWith(`/`) ? reference.slice(1) : reference)
          ?.referencedBy.set(id, postById.get(id)!.title),
      ),
    )

    for (const post of posts.values()) {
      post.referencedBy = new Map(
        [...post.referencedBy].sort(
          ([a], [b]) =>
            (postById.get(b)?.dates.published.getTime() ?? 0) -
            (postById.get(a)?.dates.published.getTime() ?? 0),
        ),
      )
    }

    return postById
  },
)

export type Ordered<P extends Post> = Simplify<
  P & {
    previous?: Pick<P, `id` | `title`>
    next?: Pick<P, `id` | `title`>
  }
>
