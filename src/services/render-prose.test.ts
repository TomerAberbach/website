import { expect, test } from 'vitest'
import { renderProse } from './render-prose.tsx'

test(`an internal link gets a focus ring`, () => {
  const html = renderProse(`<p><a href="/post">Post</a></p>`)

  expect(html).toBe(`<p><a href="/post" class="focus-ring">Post</a></p>`)
})

test(`an external link opens in a new tab without a referrer`, () => {
  const html = renderProse(`<p><a href="https://example.com">Site</a></p>`)

  expect(html).toBe(
    `<p><a href="https://example.com" class="focus-ring" target="_blank" rel="noopener noreferrer">Site</a></p>`,
  )
})

test(`other elements are left alone`, () => {
  const html = renderProse(`<h2 id="a">Title</h2><pre><code>x</code></pre>`)

  expect(html).toBe(`<h2 id="a">Title</h2><pre><code>x</code></pre>`)
})
