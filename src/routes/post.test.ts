import superjson from 'superjson'
import type { SuperJSONResult } from 'superjson'
import { expect, test } from 'vitest'
import { usePostsFixture } from '~/test/posts-fixture.ts'

usePostsFixture()

const load = async (postId: string) => {
  const { loader } = await import(`./post.tsx`)
  return loader({
    params: { '*': postId },
    request: new Request(`http://localhost:3000/${postId}`),
    context: {},
  } as unknown as Parameters<typeof loader>[0])
}

const deserialize = <Value>(result: { data: unknown }): Value =>
  superjson.deserialize<Value>(result.data as SuperJSONResult)

test(`a known post loads with only the fields the page needs`, async () => {
  const result = await load(`older-post`)

  const { post } = deserialize<{ post: Record<string, unknown> }>(result)
  expect(Object.keys(post).sort()).toEqual([
    `dates`,
    `description`,
    `features`,
    `html`,
    `id`,
    `minutesToRead`,
    `next`,
    `previous`,
    `referencedBy`,
    `tags`,
    `title`,
  ])
})

test(`a known post loads with its metadata restored to rich types`, async () => {
  const result = await load(`newer-post`)

  const { post } = deserialize<{
    post: {
      id: string
      title: string
      tags: Set<string>
      dates: { published: Date; updated?: Date }
      previous?: { id: string; title: string }
      next?: { id: string; title: string }
    }
  }>(result)
  expect(post).toMatchObject({
    id: `newer-post`,
    title: `Newer Post`,
    tags: new Set([`code`, `writing`]),
    dates: {
      published: new Date(`2024-03-04`),
      updated: new Date(`2024-05-06`),
    },
    previous: { id: `older-post`, title: `Older Post` },
  })
  expect(post).not.toHaveProperty(`next`)
})

test(`a post id with a trailing slash loads the post`, async () => {
  const result = await load(`older-post/`)

  const { post } = deserialize<{ post: { id: string } }>(result)
  expect(post.id).toBe(`older-post`)
})

test(`an unknown post throws a 404 suggesting the closest post`, async () => {
  const thrown = await load(`older-pots`).catch((error: unknown) => error)

  const response = thrown as { init: { status: number }; data: unknown }
  expect(response.init.status).toBe(404)
  expect(deserialize(response)).toEqual({
    didYouMeanPost: { id: `older-post`, title: `Older Post` },
  })
})

test(`an href post id is treated as unknown`, async () => {
  const thrown = await load(`elsewhere`).catch((error: unknown) => error)

  expect((thrown as { init: { status: number } }).init.status).toBe(404)
})
