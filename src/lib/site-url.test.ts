import { expect, test } from 'vitest'
import { getSiteUrl, SITE_URL } from './site-url.ts'

test(`SITE_URL falls back to localhost when \`import.meta.env.SITE\` is unset`, () => {
  expect(SITE_URL).toBe(`http://localhost:4321`)
})

test.each([`/some/path`, `/some/path/`, `some/path`])(
  `getSiteUrl appends the path and strips any trailing slash`,
  path => {
    expect(getSiteUrl(path)).toBe(`http://localhost:4321/some/path`)
  },
)
