import {
  HOME_PRELOAD_STYLE_ID,
  parseHomeState,
  renderPreloadStyle,
} from '~/services/home-state.ts'
import type { HomeData } from '~/services/home-state.ts'

/**
 * Inserts the stylesheet that paints the home page in the state its URL
 * selects. It runs from a blocking script in the head, before the first paint.
 */
const preloadHomeState = (data: HomeData): void => {
  document.getElementById(HOME_PRELOAD_STYLE_ID)?.remove()
  const style = document.createElement(`style`)
  style.id = HOME_PRELOAD_STYLE_ID
  style.textContent = renderPreloadStyle(
    parseHomeState(globalThis.location.search, data),
    data,
  )
  document.head.append(style)
}

export default preloadHomeState
