import { nextTick } from 'process'
import { cache } from '~/services/cache.server.js'

test(`cache calls the given function on the next tick`, async () => {
  let called = false

  cache(() => (called = true))

  expect(called).toBeFalse()
  await new Promise(nextTick)
  expect(called).toBeTrue()
})

test(`cache returns a function that does not call the given function more than once`, async () => {
  let callCount = 0

  const cached = cache(() => callCount++)

  cached()
  cached()
  await new Promise(nextTick)
  expect(callCount).toBe(1)
})
