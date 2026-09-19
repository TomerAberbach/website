import { renderToString } from 'react-dom/server'
import { afterEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import GraphFactsCarousel from './graph-facts-carousel.tsx'
import type { GraphFact } from '~/services/graph-facts.ts'
import { renderAtUrl } from '~/test/url.tsx'

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

const SECOND_FACT_TEXT = `Second fact`

/** The text of the fact once it has faded in. */
const visibleFactText = async (): Promise<string> => {
  const status = page.getByRole(`status`).element()
  await expect
    .poll(() => getComputedStyle(status.querySelector(`span`)!).opacity)
    .toBe(`1`)
  return status.textContent
}

/** The text of the fact that is not the given one. */
const otherFactText = (text: string): string =>
  text === FIRST_FACT_TEXT ? SECOND_FACT_TEXT : FIRST_FACT_TEXT

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

test(`the server render keeps the fact invisible until the client fades it in`, async () => {
  const html = renderToString(
    <GraphFactsCarousel facts={[FIRST_FACT]} onSelectVertex={() => {}} />,
  )

  expect(html).toContain(`opacity-0`)
  expect(html).toContain(`Post b`)
})

test(`a fact fades in as a status with links and vertex buttons`, async () => {
  await renderAtUrl(
    <GraphFactsCarousel facts={[FIRST_FACT]} onSelectVertex={() => {}} />,
  )

  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(FIRST_FACT_TEXT)
  await expect
    .element(page.getByText(FIRST_FACT_TEXT))
    .toHaveStyle({ opacity: `1` })
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
  await renderAtUrl(
    <GraphFactsCarousel facts={[FIRST_FACT]} onSelectVertex={onSelectVertex} />,
  )

  await page.getByRole(`button`, { name: `Post b` }).click()

  expect(onSelectVertex).toHaveBeenCalledExactlyOnceWith(`b`)
})

test(`the carousel advances to another fact after the interval`, async () => {
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderAtUrl(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )
  const initialText = await visibleFactText()

  vi.advanceTimersByTime(INTERVAL_MS)

  await expect
    .element(page.getByRole(`status`))
    .toHaveTextContent(otherFactText(initialText))
})

test(`the carousel wraps around to the initial fact`, async () => {
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderAtUrl(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )
  const initialText = await visibleFactText()
  vi.advanceTimersByTime(INTERVAL_MS)
  await expect
    .element(page.getByText(otherFactText(initialText)))
    .toHaveStyle({ opacity: `1` })
  await awaitPaint()

  vi.advanceTimersByTime(INTERVAL_MS)

  await expect.element(page.getByRole(`status`)).toHaveTextContent(initialText)
})

test(`the carousel never advances when reduced motion is preferred`, async () => {
  preferReducedMotion()
  vi.useFakeTimers({ toFake: [`setInterval`, `clearInterval`] })
  await renderAtUrl(
    <GraphFactsCarousel facts={FACTS} onSelectVertex={() => {}} />,
  )
  const initialText = await visibleFactText()

  vi.advanceTimersByTime(INTERVAL_MS)

  expect(vi.getTimerCount()).toBe(0)
  await expect.element(page.getByRole(`status`)).toHaveTextContent(initialText)
})
