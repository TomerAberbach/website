import { beforeEach, expect, test, vitest } from 'vitest'

beforeEach(() => {
  delete process.env.SITE_URL
  vitest.resetModules()
})

test(`SITE_URL is localhost when the environment variable is unset`, async () => {
  const { SITE_URL } = await import(`./site-url.ts`)

  expect(SITE_URL).toBe(`http://localhost:3000`)
})

test(`SITE_URL is the origin of the environment variable when it is set`, async () => {
  process.env.SITE_URL = `https://example.com/some/path/`

  const { SITE_URL } = await import(`./site-url.ts`)

  expect(SITE_URL).toBe(`https://example.com`)
})

test.each([`/some/path`, `/some/path/`, `some/path`])(
  `getSiteUrl appends %j to SITE_URL without a trailing slash`,
  async path => {
    const { getSiteUrl } = await import(`./site-url.ts`)

    expect(getSiteUrl(path)).toBe(`http://localhost:3000/some/path`)
  },
)

test(`getSiteUrl keeps a query string and hash`, async () => {
  const { getSiteUrl } = await import(`./site-url.ts`)

  expect(getSiteUrl(`/posts?tags=a#top`)).toBe(
    `http://localhost:3000/posts?tags=a#top`,
  )
})
