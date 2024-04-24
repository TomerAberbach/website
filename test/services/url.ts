import { jest } from 'tomer'

process.env.LOCAL_HOSTNAME = `localhost`

const originalWindow = window
beforeEach(() => {
  // @ts-expect-error Simulating the server
  delete global.window
  delete process.env.SITE_URL
  jest.resetModules()
})

test(`SITE_URL is set to localhost on the server when the environment variable is unset`, async () => {
  const { SITE_URL } = await import(`~/services/url.ts`)

  expect(SITE_URL).toBe(`http://localhost:3000`)
})

const BASE_URL = `https://example.com`
const FULL_URL = `${BASE_URL}/some/path/`

test(`SITE_URL is set based on the environment variable on the server when it is set`, async () => {
  process.env.SITE_URL = FULL_URL

  const { SITE_URL } = await import(`~/services/url.ts`)

  expect(SITE_URL).toBe(BASE_URL)
})

test(`SITE_URL is set based on the current href in the browser`, async () => {
  global.window = Object.create(originalWindow) as typeof window
  Object.defineProperty(global.window, `location`, {
    value: { href: FULL_URL },
  })

  const { SITE_URL } = await import(`~/services/url.ts`)

  expect(SITE_URL).toBe(BASE_URL)
})

test.each([`/some/path`, `/some/path/`])(
  `getSiteUrl returns the SITE_URL with the given path appended with any trailing slash removed`,
  async path => {
    const { getSiteUrl } = await import(`~/services/url.ts`)
    const url = getSiteUrl(path)

    expect(url).toBe(`http://localhost:3000/some/path`)
  },
)
