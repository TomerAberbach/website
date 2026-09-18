import { useState } from 'react'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import ShrinkWrap from './shrink-wrap.tsx'

const SHORT_TEXT = `Short`
const LONG_TEXT = `A title long enough to wrap onto several lines in a narrow box`

const textRangeWidth = (element: Element): number => {
  const range = document.createRange()
  range.selectNodeContents(element)
  return range.getBoundingClientRect().width
}

test(`the element's width is set to the width of its text`, async () => {
  await render(
    <ShrinkWrap>
      <span data-testid='text'>{SHORT_TEXT}</span>
    </ShrinkWrap>,
  )

  const element = page.getByTestId(`text`).element().parentElement!
  await expect.poll(() => element.style.width).not.toBe(``)
  const width = Number.parseFloat(element.style.width)
  expect(width).toBeCloseTo(textRangeWidth(element), 2)
})

test(`a wrapped title shrinks to its longest line`, async () => {
  const containerWidth = 150
  await render(
    <div style={{ width: containerWidth }}>
      <ShrinkWrap>
        <span data-testid='text'>{LONG_TEXT}</span>
      </ShrinkWrap>
    </div>,
  )

  const element = page.getByTestId(`text`).element().parentElement!
  await expect.poll(() => element.style.width).not.toBe(``)
  const width = Number.parseFloat(element.style.width)
  expect(width).toBeGreaterThan(0)
  expect(width).toBeLessThan(containerWidth)
  expect(width).toBeCloseTo(textRangeWidth(element), 2)
})

const EditableText = () => {
  const [text, setText] = useState(SHORT_TEXT)
  return (
    <>
      <ShrinkWrap>
        <span data-testid='text'>{text}</span>
      </ShrinkWrap>
      <button type='button' onClick={() => setText(LONG_TEXT)}>
        Lengthen
      </button>
    </>
  )
}

test(`the width is recalculated when the text changes`, async () => {
  await render(<EditableText />)
  const element = page.getByTestId(`text`).element().parentElement!
  await expect.poll(() => element.style.width).not.toBe(``)
  const shortWidth = Number.parseFloat(element.style.width)

  await page.getByRole(`button`, { name: `Lengthen` }).click()

  await expect
    .poll(() => Number.parseFloat(element.style.width))
    .toBeGreaterThan(shortWidth)
})

test(`ssr renders an inline script that sets the width before hydration`, async () => {
  const screen = await render(
    <ShrinkWrap ssr nonce='abc'>
      {SHORT_TEXT}
    </ShrinkWrap>,
  )

  const script = screen.container.querySelector(`script`)
  expect(script?.nonce).toBe(`abc`)
  expect(script?.textContent).toContain(`getBoundingClientRect`)
})

test(`a nonce without ssr is rejected`, async () => {
  await expect(
    render(<ShrinkWrap nonce='abc'>{SHORT_TEXT}</ShrinkWrap>),
  ).rejects.toThrow(`Cannot specify \`nonce\` without \`ssr\``)
})
