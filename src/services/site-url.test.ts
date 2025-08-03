import { beforeEach, expect, test, vitest } from 'vitest'

const originalDocument = document
beforeEach(() => {
  // @ts-expect-error Simulating the server
  delete global.document
  delete process.env.SITE_URL
  vitest.resetModules()
})

test(`SITE_URL is set to localhost on the server when the environment variable is unset`, async () => {
  const { SITE_URL } = await import(`./site-url`)

  expect(SITE_URL).toBe(`http://localhost:3000`)
})

const BASE_URL = `https://example.com`
const FULL_URL = `${BASE_URL}/some/path/`

test(`SITE_URL is set based on the environment variable on the server when it is set`, async () => {
  process.env.SITE_URL = FULL_URL

  const { SITE_URL } = await import(`./site-url`)

  expect(SITE_URL).toBe(BASE_URL)
})

test(`SITE_URL is set based on the current href in the browser`, async () => {
  global.document = Object.create(originalDocument) as typeof document
  Object.defineProperty(global.document, `location`, {
    value: { href: FULL_URL },
  })

  const { SITE_URL } = await import(`./site-url`)

  expect(SITE_URL).toBe(BASE_URL)
})

test.each([`/some/path`, `/some/path/`])(
  `getSiteUrl returns the SITE_URL with the given path appended with any trailing slash removed`,
  async path => {
    const { getSiteUrl } = await import(`./site-url`)
    const url = getSiteUrl(path)

    expect(url).toBe(`http://localhost:3000/some/path`)
  },
)
