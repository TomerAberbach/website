import { nextTick } from 'node:process'
import { expect, test } from 'vitest'
import { cache } from './cache.server.ts'

test(`cache calls the given function on the next tick`, async () => {
  let called = false

  cache(() => (called = true))

  expect(called).toBe(false)
  await new Promise(nextTick)
  expect(called).toBe(true)
})

test(`cache returns a function that does not call the given function more than once`, async () => {
  let callCount = 0

  const cached = cache(() => callCount++)

  cached()
  cached()
  await new Promise(nextTick)
  expect(callCount).toBe(1)
})
