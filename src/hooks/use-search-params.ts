import { useCallback, useMemo, useSyncExternalStore } from 'preact/compat'

// A tiny shared store over `location.search` so every island component reacts to
// query-param changes made by any other. Updates use `history.replaceState` so
// they don't push history entries or reset scroll.
const listeners = new Set<() => void>()

const emit = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const subscribe = (callback: () => void): (() => void) => {
  // `subscribe` only runs on the client (after hydration), so `window` exists.
  listeners.add(callback)
  globalThis.addEventListener(`popstate`, callback)
  return () => {
    listeners.delete(callback)
    globalThis.removeEventListener(`popstate`, callback)
  }
}

const getSnapshot = (): string =>
  typeof location === `undefined` ? `` : location.search

export const useSearchParams = (): [
  URLSearchParams,
  (newSearchParams: URLSearchParams) => void,
] => {
  const search = useSyncExternalStore(subscribe, getSnapshot)
  const searchParams = useMemo(() => new URLSearchParams(search), [search])

  const setSearchParams = useCallback((newSearchParams: URLSearchParams) => {
    const query = newSearchParams.toString()
    history.replaceState(null, ``, query ? `?${query}` : location.pathname)
    emit()
  }, [])

  return [searchParams, setSearchParams]
}
