import type { ReactNode } from 'react'
import { createRoutesStub, useSearchParams } from 'react-router'
import { page } from 'vitest/browser'
import type { Locator } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import type { RenderResult } from 'vitest-browser-react'

/**
 * Renders the element inside a router at the given URL, with a probe that
 * shows the current search params as JSON.
 */
export const renderWithRouter = (
  element: ReactNode,
  { url = `/` }: { url?: string } = {},
): Promise<RenderResult> => {
  const Stub = createRoutesStub([
    {
      path: `/`,
      Component: () => (
        <>
          {element}
          <SearchParamsProbe />
        </>
      ),
    },
  ])
  return render(<Stub initialEntries={[url]} />)
}

export const searchParamsProbe = (): Locator =>
  page.getByTestId(SEARCH_PARAMS_PROBE_TEST_ID)

/** The exact text the probe shows for the given search params. */
export const searchParamsText = (params: Record<string, string>): string =>
  JSON.stringify(params)

const SearchParamsProbe = () => {
  const [searchParams] = useSearchParams()
  return (
    <div data-testid={SEARCH_PARAMS_PROBE_TEST_ID}>
      {searchParamsText(Object.fromEntries(searchParams))}
    </div>
  )
}

const SEARCH_PARAMS_PROBE_TEST_ID = `search-params`
