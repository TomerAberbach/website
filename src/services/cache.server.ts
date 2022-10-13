import { nextTick } from 'process'

export function cached<Value>(fn: () => Value): () => Value {
  if (process.env.NODE_ENV !== `production`) {
    return fn
  }

  // Call and cache asynchronously to ensure dependencies are initialized
  nextTick(() => get(fn))

  return () => get(fn)
}

export function refreshCache(): void {
  for (const entry of cache.values()) {
    entry.expired = true
  }

  for (const fn of cache.keys()) {
    get(fn)
  }
}

function get<Value>(fn: () => Value): Value {
  let entry = cache.get(fn)

  if (!entry) {
    cache.set(fn, (entry = { value: undefined, expired: true }))
  }

  if (entry.expired) {
    entry.value = fn()
    entry.expired = false
  }

  return entry.value as Value
}

const cache: Map<() => unknown, { value: unknown; expired: boolean }> =
  new Map()
