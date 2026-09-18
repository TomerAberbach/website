import { toHtml } from 'hast-util-to-html'
import { expect, test } from 'vitest'
import { ASSET_NAME_TO_URL } from './assets.server.ts'
import {
  convertMarkdownToHtml,
  convertMarkdownToText,
} from './convert-markdown.server.ts'

const convert = async (markdown: string): Promise<string> =>
  toHtml(await convertMarkdownToHtml(markdown))

test(`a horizontal container directive becomes a flex div`, async () => {
  const html = await convert(`:::horizontal\nleft\n\nright\n:::`)

  expect(html).toBe(
    `<div class="child:flex-1 flex flex-wrap gap-4 max-w-full"><p>left</p><p>right</p></div>`,
  )
})

const webmUrl = ASSET_NAME_TO_URL.get(`with-postcss-fontpie.webm`)!
const mp4Url = ASSET_NAME_TO_URL.get(`with-postcss-fontpie.mp4`)!

test(`a gif directive becomes a looping video with an aria label`, async () => {
  const html = await convert(`::gif[with-postcss-fontpie]{alt="Text loading"}`)

  expect(html).toBe(
    `<div class="gif max-w-full min-w-[min(400px,100%)]"><video aria-label="Text loading" aria-roledescription="gif" autoplay class="m-0" loop muted playsinline role="img"><source src="${webmUrl}" type="video/webm"><source src="${mp4Url}" type="video/mp4"></video></div>`,
  )
})

test(`a gif directive without an alt has no aria label`, async () => {
  const html = await convert(`::gif[with-postcss-fontpie]`)

  expect(html).not.toContain(`aria-label`)
})

test(`a gif directive with an unknown name throws`, async () => {
  await expect(convert(`::gif[missing]`)).rejects.toThrow(
    `Expected GIF to exist`,
  )
})

test.each([
  {
    kind: `leaf`,
    markdown: `::audio[/media/song.mp3]`,
    expected: `<audio controls preload="" src="/media/song.mp3"><a download="song.mp3" href="/media/song.mp3" rel="noopener noreferrer">Download song.mp3</a></audio>`,
  },
  {
    kind: `text`,
    markdown: `Listen :audio[/song.mp3] here`,
    expected: `<p>Listen <audio controls preload="" src="/song.mp3"><a download="song.mp3" href="/song.mp3" rel="noopener noreferrer">Download song.mp3</a></audio> here</p>`,
  },
])(
  `a $kind audio directive becomes an audio element with a download link`,
  async ({ markdown, expected }) => {
    const html = await convert(markdown)

    expect(html).toBe(expected)
  },
)

const avatarUrl = ASSET_NAME_TO_URL.get(`avatar.png`)!

test.each([
  {
    location: `text`,
    markdown: `See $avatar.png now`,
    expected: `<p>See ${avatarUrl} now</p>`,
  },
  {
    location: `inline code`,
    markdown: `\`$avatar.png\``,
    expected: `<p><code>${avatarUrl}</code></p>`,
  },
  {
    location: `link urls`,
    markdown: `[link]($avatar.png)`,
    expected: `<p><a href="${avatarUrl}">link</a></p>`,
  },
  {
    location: `image urls`,
    markdown: `![alt]($avatar.png)`,
    expected: `<p><img alt="alt" src="${avatarUrl}"></p>`,
  },
])(
  `an asset token in $location is replaced with the asset url`,
  async ({ markdown, expected }) => {
    const html = await convert(markdown)

    expect(html).toBe(expected)
  },
)

test(`an unknown asset token is left alone`, async () => {
  const html = await convert(`$missing.png`)

  expect(html).toBe(`<p>$missing.png</p>`)
})

test(`a heading starting with a quote marker collapses its section into details`, async () => {
  const html = await convert(`# > Hidden\n\nInside\n\n# Visible\n\nOutside`)

  expect(html).toBe(
    `<details><summary><h1 id="hidden">Hidden</h1></summary><p>Inside</p></details><h1 id="visible">Visible</h1><p>Outside</p>`,
  )
})

test(`a collapsible heading nested under another collapses inside it`, async () => {
  const html = await convert(`# > Outer\n\nA\n\n## > Inner\n\nB\n\n# After`)

  expect(html).toBe(
    `<details><summary><h1 id="outer">Outer</h1></summary><p>A</p><details><summary><h2 id="inner">Inner</h2></summary><p>B</p></details></details><h1 id="after">After</h1>`,
  )
})

test(`consecutive collapsible headings each collapse their own section`, async () => {
  const html = await convert(`# > First\n\nA\n\n# > Second\n\nB`)

  expect(html).toBe(
    `<details><summary><h1 id="first">First</h1></summary><p>A</p></details><details><summary><h1 id="second">Second</h1></summary><p>B</p></details>`,
  )
})

test(`a gfm table renders as a table`, async () => {
  const html = await convert(`| a | b |\n| - | - |\n| 1 | 2 |`)

  expect(html).toBe(
    `<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`,
  )
})

test(`a gfm footnote renders a footnotes section with a back reference`, async () => {
  const html = await convert(`Text[^1]\n\n[^1]: Note`)

  expect(html).toContain(
    `<sup><a href="#fn-1" aria-describedby="footnote-label" data-footnote-ref="" id="fnref-1">1</a></sup>`,
  )
  expect(html).toContain(`<section class="footnotes" data-footnotes="">`)
  expect(html).toContain(
    `<a href="#fnref-1" aria-label="Back to reference 1" class="data-footnote-backref" data-footnote-backref="">↩</a>`,
  )
})

test(`straight quotes become smart quotes`, async () => {
  const html = await convert(`"Hello" it's`)

  expect(html).toBe(`<p>“Hello” it’s</p>`)
})

test(`a note admonition carries its icon, color, and default label`, async () => {
  const html = await convert(`:::note\nCareful\n:::`)

  expect(html).toMatch(
    /^<div data-admonition-color="blue" data-admonition-icon-url="data:image\/svg\+xml,[^"]+" data-admonition-label="Note" data-admonition-name="note" role="note"><p>Careful<\/p><\/div>$/u,
  )
})

test(`a warning admonition carries a custom label`, async () => {
  const html = await convert(`:::warning[Watch out]\nCareful\n:::`)

  expect(html).toMatch(
    /^<div data-admonition-color="yellow" data-admonition-icon-url="data:image\/svg\+xml,[^"]+" data-admonition-label="Watch out" data-admonition-name="warning" role="note"><p>Careful<\/p><\/div>$/u,
  )
})

test(`a code block is highlighted without a tab index or theme classes`, async () => {
  const html = await convert(`\`\`\`js\nconst a = 1\n\`\`\``)

  expect(html).toMatch(
    /^<pre style="background-color:#[\da-f]{6};color:#[\da-f]{6}">/u,
  )
  expect(html).toMatch(/<span style="color:#[\da-f]{6}">const<\/span>/u)
  expect(html).not.toContain(`tabindex`)
  expect(html).not.toContain(`shiki`)
})

test(`a code block title becomes a data attribute on the pre element`, async () => {
  const html = await convert(`\`\`\`js title=index.js\nconst a = 1\n\`\`\``)

  expect(html).toMatch(/^<pre data-title="index.js" style="/u)
})

test(`inline math renders with katex`, async () => {
  const html = await convert(`$x^2$`)

  expect(html).toContain(`<span class="katex">`)
})

test(`a heading gets a slug id`, async () => {
  const html = await convert(`## Hello World`)

  expect(html).toBe(`<h2 id="hello-world">Hello World</h2>`)
})

test(`an external link gets a nofollow rel`, async () => {
  const html = await convert(`[site](https://example.com)`)

  expect(html).toBe(
    `<p><a href="https://example.com" rel="nofollow">site</a></p>`,
  )
})

test(`an internal link is left alone`, async () => {
  const html = await convert(`[post](/some-post)`)

  expect(html).toBe(`<p><a href="/some-post">post</a></p>`)
})

test(`an emoji gets an accessible label`, async () => {
  const html = await convert(`Hi 👋`)

  expect(html).toBe(
    `<p>Hi <span aria-label="waving hand" role="img">👋</span></p>`,
  )
})

test(`convertMarkdownToText strips markdown and collapses whitespace`, () => {
  const text = convertMarkdownToText(
    `# Title\n\nSome *emphasis* and a [link](https://example.com).\n\n- item`,
  )

  expect(text).toBe(`Title Some emphasis and a link. item `)
})
