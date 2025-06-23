/* eslint-disable typescript/no-unsafe-return, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-assignment */

import type { Root as MdRoot } from 'mdast'
import type { Root as HtmlRoot } from 'hast'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import remarkStringify from 'remark-stringify'
import escapeStringRegExp from 'escape-string-regexp'
import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import rehypeShiki from '@shikijs/rehype'
import type { RehypeShikiOptions } from '@shikijs/rehype'
import stripMarkdown from 'strip-markdown'
import { h } from 'hastscript'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import { toString as mdToText } from 'mdast-util-to-string'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { RemarkEmbedderOptions } from '@remark-embedder/core'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import RemarkEmbedderCache from '@remark-embedder/cache'
import remarkSmartypants from 'remark-smartypants'
import { forEach, join, keys, map, pipe } from 'lfi'
import rehypeMermaid from 'rehype-mermaid'
import { invariant } from '@epic-web/invariant'
import rehypeSvgo from 'rehype-svgo'
import { remarkAdmonition } from 'remark-admonition'
import type { LeafDirective, TextDirective } from 'mdast-util-directive'
import infoSvgPath from './images/info.svg'
import warningSvgPath from './images/warning.svg'
import { ASSET_NAME_TO_URL, VIDEO_NAME_TO_URL } from './assets.server.ts'
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
        // eslint-disable-next-line typescript/switch-exhaustiveness-check
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
  .use(remarkRehype, { clobberPrefix: `` })
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
