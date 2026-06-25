import { nextTick } from 'node:process'

export const cache = <Value>(fn: () => Value): (() => Value) => {
  let value: Value
  let called = false
  const cachedFn = () => {
    if (!called) {
      called = true
      value = fn()
    }
    return value
  }

  // Call and cache asynchronously to ensure dependencies are initialized.
  nextTick(cachedFn)
  return cachedFn
}
