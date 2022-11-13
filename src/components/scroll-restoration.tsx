import {
  ScrollRestoration as RemixScrollRestoration,
  useLocation,
} from '@remix-run/react'
import { useHydrated } from 'remix-utils'

const ScrollRestoration = () => {
  const hydrated = useHydrated()
  const location = useLocation()

  if (
    hydrated &&
    location.state != null &&
    typeof location.state === `object` &&
    (location.state as { scroll?: boolean }).scroll === false
  ) {
    return null
  }

  return <RemixScrollRestoration />
}

export default ScrollRestoration
