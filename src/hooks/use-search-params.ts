import { useCallback, useSyncExternalStore } from 'react'

/**
 * The current URL's search params and a setter that replaces them in the
 * address bar. Every component using the hook sees the same params, and the
 * server render sees none.
 */
const useSearchParams = (): [
  URLSearchParams,
  (newSearchParams: URLSearchParams) => void,
] => {
  const search = useSyncExternalStore(
    subscribe,
    () => globalThis.location.search,
    () => ``,
  )

  const setSearchParams = useCallback((newSearchParams: URLSearchParams) => {
    const url = new URL(globalThis.location.href)
    url.search = newSearchParams.toString()
    globalThis.history.replaceState(globalThis.history.state, ``, url)
    notify()
  }, [])

  return [new URLSearchParams(search), setSearchParams]
}

const listeners = new Set<() => void>()

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  globalThis.addEventListener(`popstate`, listener)
  return () => {
    listeners.delete(listener)
    globalThis.removeEventListener(`popstate`, listener)
  }
}

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

export default useSearchParams
