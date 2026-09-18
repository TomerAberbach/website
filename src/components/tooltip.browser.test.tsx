import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import Tooltip from './tooltip.tsx'

test(`tooltip content is hidden until its trigger is hovered`, async () => {
  await render(
    <Tooltip content='More info'>
      <button type='button'>Trigger</button>
    </Tooltip>,
  )

  const tooltip = page.getByText(`More info`)
  await expect.element(tooltip).toHaveStyle({ opacity: `0` })

  await page.getByRole(`button`, { name: `Trigger` }).hover()

  await expect.element(tooltip).toHaveStyle({ opacity: `1` })
})

test(`tooltip labels its trigger through the generated id`, async () => {
  await render(
    <Tooltip content='Previous post'>
      {tooltipId => (
        <button type='button' aria-labelledby={tooltipId}>
          <svg />
        </button>
      )}
    </Tooltip>,
  )

  await expect
    .element(page.getByRole(`button`, { name: `Previous post` }))
    .toBeInTheDocument()
})
