import { expect, test } from 'vitest'
import { getSiteUrl, SITE_URL } from './site-url.ts'

test(`SITE_URL is the origin of the current document`, () => {
  expect(SITE_URL).toBe(document.location.origin)
})

test(`getSiteUrl resolves paths against the current origin`, () => {
  expect(getSiteUrl(`/some/path/`)).toBe(
    `${document.location.origin}/some/path`,
  )
})
