import { cached, refreshCache } from '../../src/services/cache.server'

jest.useFakeTimers()

test(`cached caches`, () => {
  let callCount = 0

  const cachedFn = cached(() => ++callCount)

  expect(cachedFn()).toBe(1)
})

test(`cached caches asynchronously`, () => {
  let callCount = 0

  cached(() => cachedFn())

  expect(callCount).toBe(0)

  const cachedFn = cached(() => callCount++)

  expect(callCount).toBe(0)

  jest.runAllTimers()

  expect(callCount).toBe(1)
})

test(`refreshCache refreshes the cache`, () => {
  let callCount = 0
  cached(() => cachedFn())
  const cachedFn = cached(() => callCount++)
  jest.runAllTimers()

  refreshCache()

  expect(callCount).toBe(2)
})
