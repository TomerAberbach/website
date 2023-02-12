import { nextTick } from 'process'
import mem from 'mem'

export const cache = <Value>(fn: () => Value): (() => Value) => {
  const cachedFn = mem(fn)

  // Call and cache asynchronously to ensure dependencies are initialized
  nextTick(cachedFn)
  return cachedFn
}
