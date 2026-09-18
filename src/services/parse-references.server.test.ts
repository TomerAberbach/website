import { h } from 'hastscript'
import { beforeEach, expect, test, vi } from 'vitest'
import fontsStylesPath from '~/styles/fonts.css?url'

beforeEach(() => {
  process.env.SITE_URL = `https://tomeraberba.ch`
  vi.resetModules()
})

const importModule = () => import(`./parse-references.server.ts`)

test.each([`#heading`, `#`, fontsStylesPath])(
  `parseReferences ignores the href %j`,
  async href => {
    const { parseReferences } = await importModule()

    const references = parseReferences([href])

    expect(references).toEqual(new Map())
  },
)

test.each([
  [`https://tomeraberba.ch/some-post`, `some-post`],
  [`/other-post`, `other-post`],
  [`https://www.example.com/page`, `example.com`],
  [`https://open.spotify.com/track/1`, `spotify.com`],
  [`https://t.co/abc`, `twitter.com`],
  [
    `https://workspaceupdates.googleblog.com/2024/01/post.html`,
    `googleblog.com`,
  ],
])(`parseReferences maps %s to the reference %s`, async (href, reference) => {
  const { parseReferences } = await importModule()

  const references = parseReferences([href])

  expect(references).toEqual(new Map([[reference, new Set([href])]]))
})

test(`parseReferences groups the hrefs of one reference into a set`, async () => {
  const { parseReferences } = await importModule()

  const references = parseReferences([
    `https://example.com/a`,
    `https://www.example.com/b`,
    `https://example.com/a`,
  ])

  expect(references).toEqual(
    new Map([
      [
        `example.com`,
        new Set([`https://example.com/a`, `https://www.example.com/b`]),
      ],
    ]),
  )
})

test(`parseHrefs collects the href of every anchor element in the tree`, async () => {
  const { parseHrefs } = await importModule()
  const tree = h(null, [
    h(`p`, [h(`a`, { href: `https://example.com` }, `one`)]),
    h(`div`, [h(`ul`, [h(`li`, [h(`a`, { href: `/post` }, `two`)])])]),
  ])

  const hrefs = parseHrefs(tree)

  expect(hrefs).toEqual(new Set([`https://example.com`, `/post`]))
})

test(`parseHrefs skips anchor elements without an href`, async () => {
  const { parseHrefs } = await importModule()
  const tree = h(null, [h(`a`, `no href`)])

  const hrefs = parseHrefs(tree)

  expect(hrefs).toEqual(new Set())
})
