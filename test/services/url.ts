const originalWindow = window
beforeEach(() => {
  // @ts-expect-error Simulating the server
  delete global.window
  jest.resetModules()
})

test(`SITE_URL is set to localhost on the server if the environment variable is unset`, async () => {
  const { SITE_URL } = await import(`~/services/url.js`)

  expect(SITE_URL).toBe(`http://localhost:3000`)
})

const BASE_URL = `https://example.com`
const FULL_URL = `${BASE_URL}/some/path/`

test(`SITE_URL is set based on the environment variable on the server if it is set`, async () => {
  process.env.SITE_URL = FULL_URL

  const { SITE_URL } = await import(`~/services/url.js`)

  expect(SITE_URL).toBe(BASE_URL)
})

test(`SITE_URL is set based on the current href in the browser`, async () => {
  global.window = Object.create(originalWindow) as typeof window
  Object.defineProperty(window, `location`, { value: { href: FULL_URL } })

  const { SITE_URL } = await import(`~/services/url.js`)

  expect(SITE_URL).toBe(BASE_URL)
})

// Workaround for --isolatedModules error due to lack of non-dynamic imports
// eslint-disable-next-line jest/no-export
export {}
