import type { Root as MdRoot, Node } from 'mdast'
import type { Element, Root as HtmlRoot } from 'hast'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import remarkStringify from 'remark-stringify'
import escapeStringRegExp from 'escape-string-regexp'
import { optimize } from 'svgo'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import remarkDirective from 'remark-directive'
import { bundledLanguages, getHighlighter } from 'shiki'
import type { Highlighter } from 'shiki'
import { toText as htmlToText } from 'hast-util-to-text'
import { toHtml } from 'hast-util-to-html'
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
import { forEach, join, map, pipe } from 'lfi'
import rehypeMermaid from 'rehype-mermaid'
import { invariant } from '@epic-web/invariant'
import fontsStylesPath from '~/styles/fonts.css'
import withPostcssFontpieMp4Path from '~/private/media/with-postcss-fontpie.mp4'
import withPostcssFontpieWebmPath from '~/private/media/with-postcss-fontpie.webm'
import withoutPostcssFontpieMp4Path from '~/private/media/without-postcss-fontpie.mp4'
import withoutPostcssFontpieWebmPath from '~/private/media/without-postcss-fontpie.webm'
import 'mdast-util-directive'

/* eslint-disable typescript/consistent-type-definitions */
declare module 'unified' {
  interface CompileResultMap {
    node: Node
  }
}
declare module 'hast' {
  interface ElementData {
    meta?: string
  }
}
/* eslint-enable typescript/consistent-type-definitions */

export const convertMarkdownToHtml = async (
  markdown: string,
): Promise<HtmlRoot> =>
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkFlex)
      .use(remarkGif)
      .use(remarkNote)
      .use(remarkReplace)
      .use(remarkSmartypants as () => void)
      .use(remarkA11yEmoji)
      .use(
        // @ts-expect-error Type definitions are wrong.
        remarkEmbedder.default as unknown,
        {
          cache:
            remarkEmbedderCache as unknown as RemarkEmbedderOptions[`cache`],
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
        css: `https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap`,
        mermaidConfig: { fontFamily: `Kantumruy Pro`, theme: `base` },
      })
      .use(rehypeOptimizeSvg)
      .use(rehypeCodeMetadata)
      .use(rehypeShiki, await highlighterPromise)
      .use(rehypeRemoveShikiClasses)
      .use(rehypeKatex)
      .use(rehypePresetMinify)
      // eslint-disable-next-line no-restricted-syntax
      .use(function () {
        // eslint-disable-next-line typescript/no-invalid-this
        this.compiler = htmlAst => htmlAst
      })
      .process(markdown)
  ).result as HtmlRoot

const remarkEmbedderCache =
  // @ts-expect-error Type definitions are wrong.
  new (RemarkEmbedderCache.default as unknown)() as RemarkEmbedderCache

// eslint-disable-next-line unicorn/consistent-function-scoping
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

// eslint-disable-next-line unicorn/consistent-function-scoping
const remarkGif = () => (tree: MdRoot) =>
  visit(tree, `leafDirective`, node => {
    if (node.name !== `gif`) {
      return
    }

    const paths = GIF_PATHS.get(pipe(node.children, map(mdToText), join(``)))
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
        h(`source`, { src: paths.webm, type: `video/webm` }),
        h(`source`, { src: paths.mp4, type: `video/mp4` }),
      ),
    ]
  })

const GIF_PATHS: ReadonlyMap<string, VideoPaths> = new Map([
  [
    `with-postcss-fontpie`,
    {
      mp4: withPostcssFontpieMp4Path,
      webm: withPostcssFontpieWebmPath,
    },
  ],
  [
    `without-postcss-fontpie`,
    {
      mp4: withoutPostcssFontpieMp4Path,
      webm: withoutPostcssFontpieWebmPath,
    },
  ],
])

type VideoPaths = {
  mp4: string
  webm: string
}

// eslint-disable-next-line unicorn/consistent-function-scoping
const remarkNote = () => (tree: MdRoot) =>
  visit(tree, `containerDirective`, node => {
    if (node.name !== `note`) {
      return
    }

    node.data ??= {}
    const { data } = node
    data.hName = `aside`
  })

const remarkReplace = () => {
  const regExp = new RegExp(
    `(${pipe(
      REPLACEMENTS.keys(),
      map(replacement => escapeStringRegExp(`$${replacement}`)),
      join(`|`),
    )})`,
    `gu`,
  )
  const replacer = (_: unknown, name: string): string =>
    REPLACEMENTS.get(name.slice(1))!

  return (tree: MdRoot) =>
    visit(
      tree,
      [`text`, `code`, `inlineCode`, `html`, `yaml`, `link`],
      node => {
        switch (node.type) {
          case `text`:
          case `code`:
          case `inlineCode`:
          case `html`:
          case `yaml`:
            node.value = node.value.replace(regExp, replacer)
            break

          case `link`:
            node.url = node.url.replace(regExp, replacer)
            break

          default:
            throw new Error(`Bad node type`)
        }
      },
    )
}

const REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  [`fonts.css`, fontsStylesPath],
  [`with-postcss-fontpie.mp4`, withPostcssFontpieMp4Path],
  [`with-postcss-fontpie.webm`, withPostcssFontpieWebmPath],
  [`without-postcss-fontpie.mp4`, withoutPostcssFontpieMp4Path],
  [`without-postcss-fontpie.webm`, withoutPostcssFontpieWebmPath],
])

// eslint-disable-next-line unicorn/consistent-function-scoping
const rehypeOptimizeSvg = () => (tree: HtmlRoot) => {
  visit(tree, { tagName: `svg` }, (node, index, parent) => {
    const optimizedSvgAst = unified()
      .use(rehypeParse, { space: `svg` })
      .parse(
        optimize(toHtml(node), {
          multipass: true,
          plugins: [
            {
              name: `preset-default`,
              params: { overrides: { inlineStyles: false } },
            },
          ],
        }).data,
      )

    invariant(
      optimizedSvgAst.children.length === 1,
      `Expected exactly one child`,
    )
    const svgElement = optimizedSvgAst.children[0]!
    parent!.children.splice(index!, 1, svgElement)
  })

  return tree
}

// eslint-disable-next-line unicorn/consistent-function-scoping
const rehypeCodeMetadata = () => (tree: HtmlRoot) => {
  visit(tree, { tagName: `pre` }, node => {
    const codeElement = extractSingleCodeElement(node)
    if (!codeElement) {
      return
    }

    const { data: { meta } = {} } = codeElement
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
  })

  return tree
}

const rehypeShiki = (highlighter: Highlighter) => (tree: HtmlRoot) => {
  visit(tree, { tagName: `pre` }, (node, index, parent): number | undefined => {
    if (!parent) {
      return undefined
    }
    index ??= 0

    const codeElement = extractSingleCodeElement(node)
    if (!codeElement) {
      return undefined
    }

    const language = extractLanguageFromClassName(
      codeElement.properties.className,
    )
    if (!language) {
      return undefined
    }

    const code = htmlToText(node).slice(0, -1)
    let highlightedCode
    try {
      highlightedCode = highlighter.codeToHtml(code, {
        theme: THEME,
        lang: language,
      })
    } catch {
      return undefined
    }

    const codeAst = unified()
      .use(rehypeParse, { fragment: true })
      .parse(highlightedCode)

    invariant(codeAst.children.length === 1, `Expected exactly one child`)
    const preElement = codeAst.children[0]!
    invariant(
      preElement.type === `element` && preElement.tagName === `pre`,
      `Expected a pre element`,
    )

    const { position, data, properties } = node
    Object.assign(preElement, {
      position,
      data,
      properties: { ...properties, ...preElement.properties },
    })

    parent.children.splice(index, 1, preElement)
    return index + codeAst.children.length
  })

  return tree
}

const extractSingleCodeElement = ({ children }: Element): Element | null => {
  if (children.length !== 1) {
    return null
  }

  const child = children[0]!
  if (child.type !== `element` || child.tagName !== `code`) {
    return null
  }

  return child
}

const THEME = `material-theme-palenight`
const highlighterPromise = getHighlighter({
  themes: [THEME],
  langs: Object.keys(bundledLanguages),
})

const extractLanguageFromClassName = (
  className: string | number | boolean | (string | number)[] | null | undefined,
): string | null => {
  if (!Array.isArray(className)) {
    return null
  }

  const languageClassName = className
    .map(String)
    .find(className => className.startsWith(LANGUAGE_PREFIX))
  if (!languageClassName) {
    return null
  }

  return languageClassName.slice(LANGUAGE_PREFIX.length)
}

const LANGUAGE_PREFIX = `language-`

// eslint-disable-next-line unicorn/consistent-function-scoping
const rehypeRemoveShikiClasses = () => (tree: HtmlRoot) => {
  visit(tree, { tagName: `pre` }, node => {
    const stack = [node]
    do {
      const node = stack.pop()!
      delete node.properties.tabIndex
      delete node.properties.className

      for (const child of node.children) {
        if (child.type === `element`) {
          stack.push(child)
        }
      }
    } while (stack.length > 0)
  })

  return tree
}

export const convertMarkdownToText = (markdown: string): string =>
  String(
    unified()
      .use(remarkParse)
      .use(stripMarkdown as () => void)
      .use(remarkStringify)
      .processSync(markdown),
  )
