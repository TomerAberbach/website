import type { Location, MetaFunction } from 'react-router'
import superjson from 'superjson'
import type { SuperJSONResult } from 'superjson'
import { expect, test, vi } from 'vitest'
import { createMeta } from './deserialize.ts'
import { serialize } from './serialize.server.ts'

const value = {
  tags: new Set([`a`, `b`]),
  referencedBy: new Map([[`post`, `Post`]]),
  dates: { published: new Date(`2024-01-05T00:00:00Z`) },
}

const metaArgs = (loaderData: unknown): Parameters<MetaFunction>[0] =>
  ({
    loaderData,
    params: {},
    location: { pathname: `/` } as Location,
  }) as Parameters<MetaFunction>[0]

test(`serialize produces data that superjson deserializes back to the same value`, () => {
  const result = serialize(value)

  const deserialized = superjson.deserialize(
    result.data as unknown as SuperJSONResult,
  )

  expect(deserialized).toEqual(value)
})

test(`serialize passes the response init through`, () => {
  const result = serialize(value, { status: 404 })

  expect(result.init?.status).toBe(404)
})

test(`createMeta passes deserialized data to the meta function`, () => {
  const meta = vi.fn(() => [])

  createMeta(meta)(metaArgs(superjson.serialize(value)))

  expect(meta).toHaveBeenCalledWith(expect.objectContaining({ data: value }))
})

test(`createMeta passes undefined data when there is none`, () => {
  const meta = vi.fn(() => [])

  createMeta(meta)(metaArgs(undefined))

  expect(meta).toHaveBeenCalledWith(
    expect.objectContaining({ data: undefined }),
  )
})

test(`createMeta returns the meta function's descriptors`, () => {
  const descriptors = [{ title: `Title` }]

  const result = createMeta(() => descriptors)(metaArgs(undefined))

  expect(result).toBe(descriptors)
})
