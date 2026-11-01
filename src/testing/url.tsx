import type { ReactNode } from 'react'
import { page } from 'vitest/browser'
import type { Locator } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import type { RenderResult } from 'vitest-browser-react'
import useSearchParams from '~/hooks/use-search-params.ts'

/**
 * Renders the element with the browser at the given URL, alongside a probe
 * that shows the current search params as JSON.
 */
export const renderAtUrl = (
  element: ReactNode,
  { url = `/` }: { url?: string } = {},
): Promise<RenderResult> => {
  globalThis.history.replaceState(null, ``, url)
  return render(
    <>
      {element}
      <SearchParamsProbe />
    </>,
  )
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
