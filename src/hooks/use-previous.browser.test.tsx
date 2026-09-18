import { useState } from 'react'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import usePrevious from './use-previous.ts'

const Counter = () => {
  const [count, setCount] = useState(0)
  const previousCount = usePrevious(count)
  return (
    <>
      <div data-testid='previous'>{String(previousCount)}</div>
      <button type='button' onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </>
  )
}

test(`the previous value is null on the first render`, async () => {
  await render(<Counter />)

  await expect.element(page.getByTestId(`previous`)).toHaveTextContent(`null`)
})

test(`the previous value is the value from the render before`, async () => {
  await render(<Counter />)

  await page.getByRole(`button`, { name: `Increment` }).click()
  await page.getByRole(`button`, { name: `Increment` }).click()

  await expect.element(page.getByTestId(`previous`)).toHaveTextContent(`1`)
})
