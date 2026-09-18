import { useState } from 'react'
import superjson from 'superjson'
import { expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import GraphWidget from './graph-widget.tsx'
import { createTagClassName } from './tags-filter-form.tsx'
import type { Graph } from '~/services/graph.server.ts'
import { createGraph } from '~/test/graph.ts'

const GRAPH = createGraph({
  posts: [
    { id: `a`, tags: [`code`] },
    { id: `b`, tags: [`music`] },
    { id: `c`, tags: [`code`, `music`] },
  ],
  externals: [
    { id: `single.com`, hrefs: [`https://single.com/page`], tags: [`code`] },
    {
      id: `multi.com`,
      hrefs: [`https://multi.com/one`, `https://multi.com/two?q=1`],
      tags: [`music`],
    },
  ],
  edges: [
    { fromId: `a`, toId: `b`, hrefs: [`/b`, `/b#section`], tags: [`code`] },
    { fromId: `a`, toId: `single.com`, hrefs: [`https://single.com/page`] },
    { fromId: `b`, toId: `multi.com`, hrefs: [`https://multi.com/one`] },
  ],
})

const renderWidget = ({
  selectedVertexId = `a`,
}: { selectedVertexId?: string } = {}) =>
  render(
    <GraphWidget
      id='graph'
      graph={GRAPH}
      selectedVertexId={selectedVertexId}
    />,
  )

// Panning to a vertex is a smooth animation, which takes a while on a busy
// machine.
const PAN_POLL = { timeout: 10_000 }

// The real posts run through the whole markdown pipeline, which renders
// diagrams in a browser and fetches embeds.
const REAL_POSTS_TIMEOUT_MS = 120_000

const center = (element: Element): { x: number; y: number } => {
  const { left, top, width, height } = element.getBoundingClientRect()
  return { x: left + width / 2, y: top + height / 2 }
}

test(`internal vertices and single link externals are links`, async () => {
  await renderWidget()

  await expect
    .element(page.getByRole(`link`, { name: `Post b` }))
    .toHaveAttribute(`href`, `/b`)
  await expect
    .element(page.getByRole(`link`, { name: `single.com` }))
    .toHaveAttribute(`href`, `https://single.com/page`)
})

test(`an external vertex with several links is a button that opens a dialog of them`, async () => {
  await renderWidget()

  await page.getByRole(`button`, { name: `multi.com` }).click()

  const dialog = page.getByRole(`dialog`)
  await expect.element(dialog).toBeVisible()
  await expect
    .element(dialog.getByRole(`link`, { name: `/one` }))
    .toHaveAttribute(`href`, `https://multi.com/one`)
  await expect
    .element(dialog.getByRole(`link`, { name: `/two?q=1` }))
    .toHaveAttribute(`href`, `https://multi.com/two?q=1`)
})

test(`the dialog closes with its close button`, async () => {
  await renderWidget()
  await page.getByRole(`button`, { name: `multi.com` }).click()

  await page.getByRole(`button`, { name: `Close` }).click()

  await expect.element(page.getByRole(`dialog`)).not.toBeInTheDocument()
})

test(`an internal vertex links to the post's page`, async () => {
  await renderWidget()

  await expect
    .element(page.getByRole(`link`, { name: `Post b` }))
    .toHaveAttribute(`href`, `/b`)
})

test(`each edge is labeled with the number of links it stands for`, async () => {
  const screen = await renderWidget()

  const weights = [...screen.container.querySelectorAll(`svg text`)]
    .map(text => text.textContent)
    .sort()
  expect(weights).toEqual([`1`, `1`, `2`])
})

test(`vertices are placed at their layout position within the graph`, async () => {
  const screen = await renderWidget()

  const graph = screen.container.querySelector(`#graph`)!
  const vertex = page
    .getByRole(`link`, { name: `Post b` })
    .element().parentElement!
  const { x, y } = GRAPH.layout.positions.get(`b`)!
  const { width, height } = GRAPH.layout.boundingBox
  expect(relativeCenter(vertex, graph)).toEqual({
    x: expect.closeTo(x / width, 2) as number,
    y: expect.closeTo(y / height, 2) as number,
  })
})

/** The center of the element as a fraction of the container's size. */
const relativeCenter = (
  element: Element,
  container: Element,
): { x: number; y: number } => {
  const containerBox = container.getBoundingClientRect()
  const { x, y } = center(element)
  return {
    x: (x - containerBox.left) / containerBox.width,
    y: (y - containerBox.top) / containerBox.height,
  }
}

test(`vertices carry a class per tag so the tag filter can style them`, async () => {
  await renderWidget()

  const vertex = page
    .getByRole(`link`, { name: `Post c` })
    .element().parentElement!
  expect(vertex.classList.contains(createTagClassName(`code`))).toBe(true)
  expect(vertex.classList.contains(createTagClassName(`music`))).toBe(true)
})

test(`the selected vertex is centered in the viewport after mount`, async () => {
  const screen = await renderWidget({ selectedVertexId: `c` })

  const viewport = screen.container.firstElementChild!
  const vertex = page.getByRole(`link`, { name: `Post c` }).element()
  await expect
    .poll(() => center(vertex).x, PAN_POLL)
    .toBeCloseTo(center(viewport).x, 0)
  await expect
    .poll(() => center(vertex).y, PAN_POLL)
    .toBeCloseTo(center(viewport).y, 0)
})

const SelectableWidget = () => {
  const [selectedVertexId, setSelectedVertexId] = useState(`a`)
  return (
    <>
      <GraphWidget
        id='graph'
        graph={GRAPH}
        selectedVertexId={selectedVertexId}
      />
      <button type='button' onClick={() => setSelectedVertexId(`c`)}>
        Select c
      </button>
    </>
  )
}

test(`changing the selected vertex pans it to the center`, async () => {
  const screen = await render(<SelectableWidget />)
  const viewport = screen.container.firstElementChild!

  await page.getByRole(`button`, { name: `Select c` }).click()

  const vertex = page.getByRole(`link`, { name: `Post c` }).element()
  await expect
    .poll(() => center(vertex).x, PAN_POLL)
    .toBeCloseTo(center(viewport).x, 0)
  await expect
    .poll(() => center(vertex).y, PAN_POLL)
    .toBeCloseTo(center(viewport).y, 0)
})

// A published post, selected so the real graph is centered on it.
const REAL_POST_ID = `avoid-layout-shifts-caused-by-web-fonts-with-postcss-fontpie`

test(
  `the widget showing the real posts matches the reference screenshot`,
  { timeout: REAL_POSTS_TIMEOUT_MS },
  async () => {
    const graph = superjson.parse<Graph>(await commands.getGraph())
    const screen = await render(
      <GraphWidget id='graph' graph={graph} selectedVertexId={REAL_POST_ID} />,
    )
    const viewport = screen.container.firstElementChild!
    const vertex = page
      .getByRole(`link`, { name: graph.vertices.get(REAL_POST_ID)!.label })
      .element()
    await expect
      .poll(() => center(vertex).x, PAN_POLL)
      .toBeCloseTo(center(viewport).x, 0)

    await expect(page.elementLocator(viewport)).toMatchScreenshot(
      `graph-widget`,
      {
        // The labels are text, whose antialiasing differs between WebKit builds
        // for different macOS versions.
        comparatorOptions: { allowedMismatchedPixelRatio: 0.02 },
        screenshotOptions: { animations: `disabled` },
      },
    )
  },
)
