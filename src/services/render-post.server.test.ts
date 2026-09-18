import { h } from 'hastscript'
import { expect, test } from 'vitest'
import { renderPost } from './render-post.server.tsx'

test.each([`h1`, `h2`, `h3`, `h4`, `h5`, `h6`])(
  `a %s with an id gets a permalink link before its text`,
  tagName => {
    const html = renderPost(h(null, h(tagName, { id: `intro` }, `Intro`)))

    expect(html).toMatch(
      new RegExp(
        `^<${tagName} id="intro" class="[^"]*"><a data-discover="true" href="#intro" class="[^"]*"><img src="[^"]+" class="[^"]*" alt="Intro permalink"/></a>Intro</${tagName}>$`,
        `u`,
      ),
    )
  },
)

test(`a heading without an id has no permalink`, () => {
  const html = renderPost(h(null, h(`h2`, `Intro`)))

  expect(html).toBe(`<h2>Intro</h2>`)
})

test(`the footnote label heading has no permalink`, () => {
  const html = renderPost(h(null, h(`h2`, { id: `footnote-label` }, `Notes`)))

  expect(html).toBe(`<h2 id="footnote-label">Notes</h2>`)
})

test(`the footnotes section is styled`, () => {
  const html = renderPost(h(null, h(`section`, { dataFootnotes: true })))

  expect(html).toMatch(
    /^<section data-footnotes="true" class="[^"]+"><\/section>$/u,
  )
})

test(`a plain section is left alone`, () => {
  const html = renderPost(h(null, h(`section`, `Text`)))

  expect(html).toBe(`<section>Text</section>`)
})

test(`a table is wrapped in a scrolling container`, () => {
  const html = renderPost(h(null, h(`table`, h(`tr`, h(`td`, `1`)))))

  expect(html).toBe(
    `<div class="overflow-auto"><table><tr><td>1</td></tr></table></div>`,
  )
})

test(`a footnote back reference renders an icon with a tooltip`, () => {
  const html = renderPost(
    h(
      null,
      h(`a`, {
        href: `#fnref-1`,
        dataFootnoteBackref: true,
        ariaLabel: `Back`,
      }),
    ),
  )

  expect(html).toContain(`>Back to content</span>`)
  expect(html).toMatch(
    /<a href="#fnref-1" aria-labelledby="[^"]+" class="[^"]*"><img src="[^"]+" alt="" class="[^"]*"\/><\/a>/u,
  )
  expect(html).not.toContain(`aria-label="Back"`)
})

test(`a plain link is left alone`, () => {
  const html = renderPost(h(null, h(`a`, { href: `/post` }, `Post`)))

  expect(html).toBe(`<a href="/post">Post</a>`)
})

test.each([`blue`, `yellow`])(
  `a %s admonition renders its label and icon`,
  color => {
    const html = renderPost(
      h(
        null,
        h(
          `div`,
          {
            dataAdmonitionName: `note`,
            dataAdmonitionLabel: `Note`,
            dataAdmonitionIconUrl: `/icon.svg`,
            dataAdmonitionColor: color,
          },
          h(`p`, `Careful`),
        ),
      ),
    )

    expect(html).toContain(`<img src="/icon.svg" alt=""`)
    expect(html).toMatch(/<header class="[^"]*">Note<\/header>/u)
    expect(html).toContain(`<p>Careful</p>`)
    expect(html).not.toContain(`data-admonition`)
  },
)

test(`a plain div is left alone`, () => {
  const html = renderPost(h(null, h(`div`, `Text`)))

  expect(html).toBe(`<div>Text</div>`)
})

test(`a code block with a title renders the title as a heading above it`, () => {
  const html = renderPost(
    h(null, h(`pre`, { dataTitle: `index.js`, style: `color:red` }, `code`)),
  )

  expect(html).toMatch(
    /^<div role="heading" aria-level="2" style="color:red" class="[^"]*">index.js<\/div><pre style="color:red" class="[^"]*">code<\/pre>$/u,
  )
})

test(`a code block without a title is left alone`, () => {
  const html = renderPost(h(null, h(`pre`, { style: `color:red` }, `code`)))

  expect(html).toBe(`<pre style="color:red">code</pre>`)
})
