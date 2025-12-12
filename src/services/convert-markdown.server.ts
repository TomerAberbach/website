/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import { invariant } from '@epic-web/invariant'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import RemarkEmbedderCache from '@remark-embedder/cache'
import type { RemarkEmbedderOptions } from '@remark-embedder/core'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import rehypeShiki from '@shikijs/rehype'
import type { RehypeShikiOptions } from '@shikijs/rehype'
import escapeStringRegExp from 'escape-string-regexp'
import type { Root as HtmlRoot } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { h } from 'hastscript'
import { forEach, join, keys, map, pipe } from 'lfi'
import type { Root as MdRoot } from 'mdast'
import type { LeafDirective, TextDirective } from 'mdast-util-directive'
import { headingRange } from 'mdast-util-heading-range'
import { toHast } from 'mdast-util-to-hast'
import { toString as mdToText } from 'mdast-util-to-string'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypeMermaid from 'rehype-mermaid'
import rehypePresetMinify from 'rehype-preset-minify'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeSvgo from 'rehype-svgo'
import { remarkAdmonition } from 'remark-admonition'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkSmartypants from 'remark-smartypants'
import remarkStringify from 'remark-stringify'
import stripMarkdown from 'strip-markdown'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { ASSET_NAME_TO_URL, VIDEO_NAME_TO_URL } from './assets.server.ts'
import infoSvgPath from './images/info.svg'
import warningSvgPath from './images/warning.svg'
import 'mdast-util-directive'

export const convertMarkdownToHtml = async (
  markdown: string,
): Promise<HtmlRoot> =>
  markdownToHtmlProcessor.run(markdownToHtmlProcessor.parse(markdown))

const remarkEmbedderCache =
  // @ts-expect-error Type definitions are wrong.
  new (RemarkEmbedderCache.default as unknown)() as RemarkEmbedderCache

const remarkFlex = () => (tree: MdRoot) =>
  visit(tree, `containerDirective`, node => {
    if (node.name !== `horizontal`) {
      return
    }

    node.data ??= {}
    const { data } = node
    data.hName = `div`
    data.hProperties = { class: `flex max-w-full flex-wrap child:flex-1` }
  })

const remarkGif = () => (tree: MdRoot) =>
  visit(tree, `leafDirective`, node => {
    if (node.name !== `gif`) {
      return
    }

    const paths = VIDEO_NAME_TO_URL.get(
      pipe(node.children, map(mdToText), join(``)),
    )
    invariant(paths, `Expected GIF to exist`)

    const alt = node.attributes?.alt

    node.data ??= {}
    const { data } = node
    data.hName = `div`
    data.hProperties = { class: `gif min-w-[min(400px,100%)] max-w-full` }
    data.hChildren = [
      h(
        `video`,
        {
          role: `img`,
          'aria-roledescription': `gif`,
          ...(alt ? { 'aria-label': alt } : {}),
          class: `m-0`,
          autoplay: true,
          loop: true,
          muted: true,
          playsinline: true,
        },
        paths.webm && h(`source`, { src: paths.webm, type: `video/webm` }),
        paths.mp4 && h(`source`, { src: paths.mp4, type: `video/mp4` }),
      ),
    ]
  })

const remarkAudio = () => (tree: MdRoot) =>
  // @ts-expect-error Types are no good.
  visit(
    tree,
    [`leafDirective`, `textDirective`] as const,
    (node: LeafDirective | TextDirective) => {
      if (node.name !== `audio`) {
        return
      }

      const src = pipe(node.children, map(mdToText), join(``))
      const filename = src.split(`/`).at(-1)

      node.data ??= {}
      const { data } = node
      data.hName = `audio`
      data.hProperties = { controls: `controls`, preload: `auto`, src }
      data.hChildren = [
        h(
          `a`,
          {
            href: src,
            download: filename,
            rel: `noopener noreferrer`,
          },
          `Download ${filename}`,
        ),
      ]
    },
  )

const remarkReplace = () => {
  const regExp = new RegExp(
    `(${pipe(
      keys(ASSET_NAME_TO_URL),
      map(replacement => escapeStringRegExp(`$${replacement}`)),
      join(`|`),
    )})`,
    `gu`,
  )
  const replacer = (_: unknown, name: string): string =>
    ASSET_NAME_TO_URL.get(name.slice(1))!

  return (tree: MdRoot) =>
    visit(
      tree,
      [`text`, `code`, `inlineCode`, `html`, `yaml`, `image`, `link`],
      node => {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (node.type) {
          case `text`:
          case `code`:
          case `inlineCode`:
          case `html`:
          case `yaml`:
            node.value = node.value.replace(regExp, replacer)
            break

          case `image`:
          case `link`:
            node.url = node.url.replace(regExp, replacer)
            break

          default:
            throw new Error(`Bad node type`)
        }
      },
    )
}

const remarkCollapsibleHeading = () => (tree: MdRoot) => {
  let modified: boolean
  do {
    modified = false
    headingRange(
      tree,
      (text: string) => text.startsWith(`> `),
      (start, nodes, end) => {
        modified = true

        const firstChild = start.children[0]
        invariant(
          firstChild?.type === `text`,
          `Expected heading to start with text`,
        )
        firstChild.value = firstChild.value.slice(`> `.length)

        return [
          {
            type: `html`,
            data: {
              hName: `details`,
              hChildren: [
                {
                  type: `element`,
                  tagName: `summary`,
                  properties: {},
                  children: [{ type: `raw`, value: toHtml(toHast(start)) }],
                },
                {
                  type: `raw`,
                  value: nodes.map(node => toHtml(toHast(node))).join(``),
                },
              ],
            },
            value: ``,
          },
          end,
        ]
      },
    )
  } while (modified) // eslint-disable-line @typescript-eslint/no-unnecessary-condition
}

const markdownToHtmlProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkFlex)
  .use(remarkGif)
  .use(remarkAudio)
  .use(remarkAdmonition, {
    types: new Map([
      [
        `note`,
        {
          defaultLabel: `Note`,
          properties: {
            'data-admonition-icon-url': infoSvgPath,
            'data-admonition-color': `blue`,
          },
        },
      ],
      [
        `warning`,
        {
          defaultLabel: `Warning`,
          properties: {
            'data-admonition-icon-url': warningSvgPath,
            'data-admonition-color': `yellow`,
          },
        },
      ],
    ]),
  })
  .use(remarkReplace)
  .use(remarkSmartypants)
  .use(remarkA11yEmoji)
  .use(
    // @ts-expect-error Type definitions are wrong.
    remarkEmbedder.default as unknown,
    {
      cache: remarkEmbedderCache as unknown as RemarkEmbedderOptions[`cache`],
      transformers: [
        // @ts-expect-error Type definitions are wrong.
        remarkTransformerOembed.default,
      ],
    },
  )
  .use(remarkMath)
  .use(remarkCollapsibleHeading)
  .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: `` })
  .use(rehypeRaw)
  .use(rehypeExternalLinks)
  .use(rehypeSlug)
  .use(rehypeMermaid, {
    css: `https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100..700;1,100..700&display=swap`,
    mermaidConfig: {
      fontSize: 16,
      fontFamily: `Kantumruy Pro`,
      theme: `base`,
      flowchart: {
        wrappingWidth: 400,
      },
    },
    launchOptions: {
      // https://github.com/puppeteer/puppeteer/issues/2410#issuecomment-659021191
      args: [`--font-render-hinting=none`],
    },
  })
  .use(rehypeSvgo, { svgoConfig: { multipass: true } })
  .use(rehypeKatex)
  .use(rehypeShiki, {
    theme: `material-theme-palenight`,
    transformers: [
      // Remove unnecessary attributes.
      {
        pre: node => {
          delete node.properties.tabindex
          delete node.properties.class
        },
        span: node => {
          delete node.properties.class
        },
      },
      // Extract meta.
      {
        pre(node) {
          const meta = this.options.meta?.__raw ?? ``
          if (!meta) {
            return
          }

          pipe(
            String(meta).split(`,`),
            map(value => {
              const values = value.split(`=`)
              invariant(values.length === 2, `Expected a pair`)
              return values as [string, string]
            }),
            forEach(([key, value]) => (node.properties[`data-${key}`] = value)),
          )
        },
      },
    ],
  } satisfies RehypeShikiOptions)
  .use(rehypePresetMinify)
  .freeze()

export const convertMarkdownToText = (markdown: string): string =>
  String(markdownToTextProcessor.processSync(markdown)).replaceAll(/\s+/gu, ` `)

const markdownToTextProcessor = unified()
  .use(remarkParse)
  .use(stripMarkdown)
  .use(remarkStringify)
  .freeze()
