import { nextTick } from 'process'
import mem from 'mem'

export const cached = <Value>(fn: () => Value): (() => Value) => {
  if (process.env.NODE_ENV === `development`) {
    return fn
  }

  const cachedFn = mem(fn)

  // Call and cache asynchronously to ensure dependencies are initialized
  nextTick(cachedFn)
  return cachedFn
}
