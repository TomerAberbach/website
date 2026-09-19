import { useSyncExternalStore } from 'react'

/**
 * Whether the render is a client render. The server render and the hydration
 * render see false, and the render React does right after hydration sees true.
 */
const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

const subscribe = (): (() => void) => () => {}

export default useHydrated
