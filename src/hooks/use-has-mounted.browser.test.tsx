import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import useHasMounted from './use-has-mounted.ts'

const Probe = () => {
  const hasMounted = useHasMounted()
  return <div data-testid='mounted'>{String(hasMounted)}</div>
}

test(`the hook reports mounted after the first render commits`, async () => {
  await render(<Probe />)

  await expect.element(page.getByTestId(`mounted`)).toHaveTextContent(`true`)
})

test(`the hook reports not mounted when rendered to a string`, () => {
  const html = renderToString(<Probe />)

  expect(html).toContain(`false`)
})
