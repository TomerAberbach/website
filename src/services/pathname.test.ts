import { expect, test } from 'vitest'
import { getPagePathname } from './pathname.ts'

test.each([
  [`/index.html`, `/`],
  [`/`, `/`],
  [`/some-post.html`, `/some-post`],
  [`/some-post`, `/some-post`],
  [`/nested/index.html`, `/nested/`],
])(`getPagePathname maps %s to %s`, (pathname, pagePathname) => {
  expect(getPagePathname(pathname)).toBe(pagePathname)
})
