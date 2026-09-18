import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import GraphFactsCarousel from './graph-facts-carousel.tsx'
import type { GraphFact } from '~/services/graph-facts.server.ts'
import { renderWithRouter } from '~/test/router.tsx'

const FIRST_FACT: GraphFact = {
  text: [
    `The `,
    {
      text: `diameter`,
      href: `https://en.wikipedia.org/wiki/Distance_(graph_theory)`,
    },
    ` is 3, between `,
    { text: `Post a`, vertexId: `a` },
    ` and `,
    { text: `Post b`, vertexId: `b` },
  ],
}
const FIRST_FACT_TEXT = `The diameter is 3, between Post a and Post b`
const SECOND_FACT: GraphFact = { text: [`Second fact`] }
const FACTS = [FIRST_FACT, SECOND_FACT]

// The default interval of `useCarouselIndex`.
const INTERVAL_MS = 8000

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// A fade only transitions once the browser has painted the current state.
const awaitPaint = () =>
  new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  })

const preferReducedMotion = () =>
  vi.spyOn(globalThis, `matchMedia`).mockImplementation(
    query =>
      ({
        matches: query.includes(`prefers-reduced-motion`),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )

test(`the first fact is shown as a status with links and vertex buttons`, async () => {
  await renderWithRouter(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )

  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(FIRST_FACT_TEXT)
  await expect
    .element(page.getByRole(`link`, { name: `diameter` }))
    .toHaveAttribute(
      `href`,
      `https://en.wikipedia.org/wiki/Distance_(graph_theory)`,
    )
  await expect
    .element(page.getByRole(`button`, { name: `Post b` }))
    .toBeInTheDocument()
})

test(`clicking a vertex segment selects that vertex`, async () => {
  const onSelectVertex = vi.fn()
  await renderWithRouter(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={onSelectVertex} />,
  )

  await page.getByRole(`button`, { name: `Post b` }).click()

  expect(onSelectVertex).toHaveBeenCalledExactlyOnceWith(`b`)
})

test(`the carousel advances to the next fact after the interval`, async () => {
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderWithRouter(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )
  await awaitPaint()

  vi.advanceTimersByTime(INTERVAL_MS)

  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(`Second fact`)
})

test(`the carousel wraps around to the first fact`, async () => {
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderWithRouter(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )
  await awaitPaint()
  vi.advanceTimersByTime(INTERVAL_MS)
  await expect
    .element(page.getByText(`Second fact`))
    .toHaveStyle({ opacity: `1` })
  await awaitPaint()

  vi.advanceTimersByTime(INTERVAL_MS)

  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(FIRST_FACT_TEXT)
})

test(`the carousel never advances when reduced motion is preferred`, async () => {
  preferReducedMotion()
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderWithRouter(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )

  vi.advanceTimersByTime(INTERVAL_MS)

  expect(vi.getTimerCount()).toBe(0)
  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(FIRST_FACT_TEXT)
})
