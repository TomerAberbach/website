import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import HomeWidgets from './home-widgets.tsx'
import {
  getHomeData,
  HOME_PRELOAD_STYLE_ID,
  parseHomeState,
  renderPreloadStyle,
} from '~/services/home-state.ts'
import { createGraph } from '~/test/graph.ts'

// Newest first, as `getOrderedPosts` orders them.
const GRAPH = createGraph({
  posts: [
    { id: `newest`, tags: [`music`] },
    { id: `middle`, tags: [`code`] },
    { id: `oldest`, tags: [`music`, `code`] },
  ],
  edges: [{ fromId: `newest`, toId: `oldest`, hrefs: [`/oldest`] }],
})
GRAPH.facts.push({ text: [`A fact`] })
const DATA = getHomeData(GRAPH.vertices.keys(), GRAPH)

const SEARCH = `?post=middle&tags=code,music&op=and`

// Panning to a vertex is a smooth animation, which takes a while on a busy
// machine.
const PAN_POLL = { timeout: 10_000 }

const center = (element: Element): { x: number; y: number } => {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { x: left + width / 2, y: top + height / 2 }
}

/**
 * Mimics the home page: the static HTML of the default state, the stylesheet
 * the preload script inserts for the URL, and then hydration.
 */
const renderStatic = (search = SEARCH) => {
  globalThis.history.replaceState(null, ``, `/${search}`)

  const style = document.createElement(`style`)
  style.id = HOME_PRELOAD_STYLE_ID
  style.textContent = renderPreloadStyle(parseHomeState(search, DATA), DATA)
  document.head.append(style)

  const container = document.createElement(`div`)
  container.innerHTML = renderToString(
    <HomeWidgets data={DATA} graph={GRAPH} />,
  )
  document.body.append(container)
  return container
}

const hydrate = (container: HTMLElement) => {
  const onRecoverableError = vi.fn()
  const root = hydrateRoot(
    container,
    <HomeWidgets data={DATA} graph={GRAPH} />,
    { onRecoverableError },
  )
  return { root, onRecoverableError }
}

let cleanup = () => {}
afterEach(() => {
  cleanup()
  cleanup = () => {}
  document.getElementById(HOME_PRELOAD_STYLE_ID)?.remove()
})

const expectUrlState = async () => {
  await expect
    .element(page.getByRole(`link`, { name: `Post middle` }).first())
    .toBeVisible()
  await expect
    .element(
      page
        .getByRole(`link`, { name: `Post newest`, includeHidden: true })
        .first(),
    )
    .not.toBeVisible()
  await expect
    .element(page.getByRole(`button`, { name: `code and music` }))
    .toBeVisible()
  await expect
    .element(page.getByRole(`button`, { name: `Reset` }))
    .toBeVisible()
  await expect
    .element(page.getByRole(`button`, { name: `Previous post` }))
    .toBeVisible()
  await expect
    .element(page.getByRole(`button`, { name: `Next post` }))
    .toBeVisible()
  await expect
    .element(page.getByRole(`radio`, { name: `&&` }))
    .toHaveStyle({ borderColor: `hsl(201, 93%, 48%)` })
  await expect
    .element(page.getByRole(`radio`, { name: `||` }))
    .toHaveStyle({ borderColor: `hsl(201, 5%, 70%)` })
  await expect
    .element(
      page
        .getByRole(`link`, { name: `Post newest`, includeHidden: true })
        .last(),
    )
    .toHaveStyle({ visibility: `hidden` })
}

test(`the preload stylesheet paints the static HTML in the URL's state`, async () => {
  const container = renderStatic()
  cleanup = () => container.remove()

  await expectUrlState()
})

test(`hydration keeps the URL's state, reports no mismatch, and drops the stylesheet`, async () => {
  const container = renderStatic()
  const { root, onRecoverableError } = hydrate(container)
  cleanup = () => {
    root.unmount()
    container.remove()
  }

  await expectUrlState()
  await expect
    .poll(() => document.getElementById(HOME_PRELOAD_STYLE_ID))
    .toBeNull()
  expect(onRecoverableError).not.toHaveBeenCalled()
})

// The selected vertex may or may not change between the hydration render,
// which sees no search params, and the render after it.
test.each([
  [`the default post`, `?tags=music`, `Post newest`],
  [`another post`, `?post=oldest`, `Post oldest`],
])(
  `the graph is centered on %s before and after hydration`,
  async (_, search, name) => {
    const container = renderStatic(search)
    const viewport =
      container.querySelector(`#home-graph`)!.parentElement!.parentElement!
    const vertex = () =>
      page.getByRole(`link`, { name, includeHidden: true }).last().element()
    expect(center(vertex()).x).toBeCloseTo(center(viewport).x, 0)
    expect(center(vertex()).y).toBeCloseTo(center(viewport).y, 0)

    const { root } = hydrate(container)
    cleanup = () => {
      root.unmount()
      container.remove()
    }

    await expect
      .poll(() => document.getElementById(HOME_PRELOAD_STYLE_ID))
      .toBeNull()
    await expect
      .poll(() => center(vertex()).x, PAN_POLL)
      .toBeCloseTo(center(viewport).x, 0)
    await expect
      .poll(() => center(vertex()).y, PAN_POLL)
      .toBeCloseTo(center(viewport).y, 0)
  },
)
