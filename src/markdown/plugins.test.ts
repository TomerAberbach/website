import type { Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { h } from 'hastscript'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import { remarkAdmonition } from 'remark-admonition'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { expect, test } from 'vitest'
import rehypeAdmonition from './rehype-admonition.ts'
import rehypeCodeTitle from './rehype-code-title.ts'
import rehypeFootnoteBackref from './rehype-footnote-backref.ts'
import rehypeHeadingAnchors from './rehype-heading-anchors.ts'
import rehypeTableWrapper from './rehype-table-wrapper.ts'
import remarkUnknownDirective from './remark-unknown-directive.ts'

// A trimmed version of the production pipeline that exercises the five HAST
// plugins without the heavy embedder/Shiki/Mermaid/KaTeX dependencies.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkAdmonition, {
    types: new Map([
      [
        `note`,
        {
          defaultLabel: `Note`,
          properties: {
            'data-admonition-icon-url': `/info.svg`,
            'data-admonition-color': `blue`,
          },
        },
      ],
      [
        `warning`,
        {
          defaultLabel: `Warning`,
          properties: {
            'data-admonition-icon-url': `/warning.svg`,
            'data-admonition-color': `yellow`,
          },
        },
      ],
    ]),
  })
  .use(remarkUnknownDirective)
  .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: `` })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHeadingAnchors)
  .use(rehypeTableWrapper)
  .use(rehypeAdmonition)
  .use(rehypeCodeTitle)
  .use(rehypeFootnoteBackref)
  .freeze()

const render = async (markdown: string): Promise<string> =>
  toHtml(await processor.run(processor.parse(markdown)))

test(`heading anchors get a permalink and skip the footnotes label`, async () => {
  const html = await render(`## Hello **world**`)

  expect(html).toContain(`<h2 id="hello-world" class="group relative">`)
  expect(html).toContain(
    `<a href="#hello-world" class="absolute top-1/2 size-6 translate-x-[-1.85rem] -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 in-[summary]:translate-x-[-3.35rem] focus-ring">`,
  )
  expect(html).toContain(`class="not-prose m-0 size-6"`)
  expect(html).toContain(`alt="Hello <strong>world</strong> permalink"`)
})

test(`tables get a scroll wrapper`, async () => {
  const html = await render(`| a | b |\n| - | - |\n| 1 | 2 |`)
  expect(html).toContain(`<div class="overflow-auto"><table>`)
})

test(`note admonition becomes a blue card with an icon and label`, async () => {
  const html = await render(`:::note\nBody text.\n:::`)

  expect(html).toContain(
    `<div role="note" class="relative my-10 rounded-md border-l-4 p-8 border-l-blue-500 bg-blue-50">`,
  )
  expect(html).toContain(`src="/info.svg"`)
  expect(html).toContain(
    `<header class="pb-2 text-base font-semibold uppercase">Note</header>`,
  )
  expect(html).toContain(
    `<div class="*:first:mt-0 *:last:mb-0"><p>Body text.</p></div>`,
  )
  expect(html).not.toContain(`data-admonition`)
})

test(`warning admonition uses the yellow palette`, async () => {
  const html = await render(`:::warning\nWarn.\n:::`)
  expect(html).toContain(`border-l-yellow-500 bg-yellow-100`)
  expect(html).toContain(`border-yellow-100 bg-yellow-100`)
})

test(`inline times survive directive parsing`, async () => {
  const html = await render(`Between 11:00pm and 11:59pm (PT) on November 7`)
  expect(html).toContain(
    `<p>Between 11:00pm and 11:59pm (PT) on November 7</p>`,
  )
})

test(`an unhandled text directive with a label and attributes round-trips`, async () => {
  const html = await render(`Ratio :foo[bar]{baz="qux"} here`)
  expect(html).toContain(`<p>Ratio :foo[bar]{baz="qux"} here</p>`)
})

test(`code titles move into a heading bar above the pre`, () => {
  const tree: Root = {
    type: `root`,
    children: [
      h(
        `pre`,
        { 'data-title': `example.js`, style: `background-color:#292d3e` },
        [h(`code`, `const x = 1`)],
      ),
    ],
  }
  rehypeCodeTitle()(tree)
  const html = toHtml(tree)

  expect(html).toContain(
    `<div role="heading" aria-level="2" style="background-color:#292d3e" class="ml-5 inline-block translate-y-1 rounded-t-md px-3 pt-2 font-mono text-sm text-gray-100">example.js</div>`,
  )
  expect(html).toContain(`<pre style="background-color:#292d3e" class="mt-0">`)
  expect(html).not.toContain(`data-title`)
})

test(`footnotes section is restyled and backrefs keep the ↩ glyph`, async () => {
  const html = await render(`Text.[^1]\n\n[^1]: A footnote.`)

  expect(html).toContain(
    `<section data-footnotes="" class="prose-base border-t-2 border-y-gray-100 pt-4">`,
  )
  // Backref keeps its default glyph and just gains a focus ring.
  expect(html).toContain(`class="data-footnote-backref focus-ring"`)
  expect(html).toContain(`aria-label="Back to reference 1"`)
  expect(html).toContain(`↩`)
  expect(html).not.toContain(`Back to content`)
  expect(html).not.toContain(`footnote-backref-tooltip`)
})
