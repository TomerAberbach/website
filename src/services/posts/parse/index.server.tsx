import readingTime from 'reading-time'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import clsx from 'clsx'
import type { Element, Root as HtmlRoot } from 'hast'
import type { Root as MdRoot } from 'mdast'
import remarkParse from 'remark-parse'
import { z } from 'zod'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import remarkStringify from 'remark-stringify'
import escapeStringRegExp from 'escape-string-regexp'
import parseFrontMatter from 'gray-matter'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import remarkDirective from 'remark-directive'
import { type Highlighter, getHighlighter } from 'shiki'
import { toText as htmlToText } from 'hast-util-to-text'
import stripMarkdown from 'strip-markdown'
import { h } from 'hastscript'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import { toString as mdToText } from 'mdast-util-to-string'
import rehypeRaw from 'rehype-raw'
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
import { parseHrefs, parseReferences } from './references.server.js'
import linkSvgPath from './images/link.svg'
import backToContentSvgPath from './images/back-to-content.svg'
import type { HrefPost, MarkdownPost, Post } from '~/services/posts/types.js'
import type { RawPost } from '~/services/posts/read.server.js'
import { renderHtml } from '~/services/html.js'
import type { Components } from '~/services/html.js'
import { Link } from '~/components/link.js'
import Tooltip from '~/components/tooltip.js'
import assert from '~/services/assert.js'
import fontsStylesPath from '~/styles/fonts.css'
import withPostcssFontpieMp4Path from '~/private/media/with-postcss-fontpie.mp4'
import withPostcssFontpieWebmPath from '~/private/media/with-postcss-fontpie.webm'
import withoutPostcssFontpieMp4Path from '~/private/media/without-postcss-fontpie.mp4'
import withoutPostcssFontpieWebmPath from '~/private/media/without-postcss-fontpie.webm'

const parsePost = async (rawPost: RawPost): Promise<Post> => {
  const { content, data } = parseFrontMatter(rawPost.content)
  return {
    id: rawPost.id,
    ...(content.trim().length > 0
      ? await parseMarkdownPost(content, data)
      : parseHrefPost(data)),
    referencedBy: new Set(),
  }
}

const parseMarkdownPost = async (
  content: string,
  metadata: Record<string, unknown>,
): Promise<Omit<MarkdownPost, `id` | `referencedBy`>> => {
  const htmlAst = await convertMarkdownToHtml(content)

  return {
    type: `markdown`,
    ...basePostMetadataSchema.parse(metadata),
    references: parseReferences(parseHrefs(htmlAst)),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    content: renderToString(renderHtml(htmlAst, components)),
    description: truncate(convertMarkdownToText(content)),
  }
}

const convertMarkdownToHtml = async (markdown: string): Promise<HtmlRoot> =>
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(() => remarkFlex)
      .use(() => remarkGif)
      .use(remarkReplace)
      .use(remarkSmartypants)
      .use(remarkA11yEmoji)
      .use(remarkEmbedder, {
        cache:
          new RemarkEmbedderCache() as unknown as RemarkEmbedderOptions[`cache`],
        transformers: [remarkTransformerOembed],
      })
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: `` })
      .use(rehypeRaw)
      .use(rehypeExternalLinks)
      .use(rehypeSlug)
      .use(() => rehypeCodeMetadata)
      .use(rehypeShiki, await highlighterPromise)
      .use(() => rehypeRemoveShikiClasses)
      .use(rehypeKatex)
      .use(rehypePresetMinify)
      // eslint-disable-next-line no-restricted-syntax
      .use(function () {
        // eslint-disable-next-line typescript/no-invalid-this
        this.Compiler = htmlAst => htmlAst
      })
      .process(markdown)
  ).result as HtmlRoot

const remarkFlex = (tree: MdRoot) => {
  visit(tree, `containerDirective`, node => {
    if (node.name !== `horizontal`) {
      return
    }

    node.data ??= {}
    const { data } = node
    data.hName = `div`
    data.hProperties = { class: `flex max-w-full flex-wrap child:flex-1` }
  })

  return tree
}

const remarkGif = (tree: MdRoot) => {
  visit(tree, `leafDirective`, node => {
    if (node.name !== `gif`) {
      return
    }

    const paths = GIF_PATHS.get(pipe(node.children, map(mdToText), join(``)))
    assert(paths)

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

  return tree
}

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

  return (tree: MdRoot) => {
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

    return tree
  }
}

const REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  [`fonts.css`, fontsStylesPath],
  [`with-postcss-fontpie.mp4`, withPostcssFontpieMp4Path],
  [`with-postcss-fontpie.webm`, withPostcssFontpieWebmPath],
  [`without-postcss-fontpie.mp4`, withoutPostcssFontpieMp4Path],
  [`without-postcss-fontpie.webm`, withoutPostcssFontpieWebmPath],
])

const rehypeCodeMetadata = (tree: HtmlRoot) => {
  visit(tree, { tagName: `pre` }, node => {
    const codeElement = extractSingleCodeElement(node)
    if (!codeElement) {
      return
    }

    const { data: { meta } = {} } = codeElement
    if (!meta) {
      return
    }

    node.properties ??= {}
    pipe(
      String(meta).split(`,`),
      map(value => {
        const values = value.split(`=`)
        assert(values.length === 2)
        return values as [string, string]
      }),
      forEach(([key, value]) => (node.properties![`data-${key}`] = value)),
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
      codeElement.properties?.className,
    )
    if (!language) {
      return undefined
    }

    const code = htmlToText(node).slice(0, -1)
    let highlightedCode
    try {
      highlightedCode = highlighter.codeToHtml(code, { lang: language })
    } catch {
      return undefined
    }

    const codeAst = unified()
      .use(rehypeParse, { fragment: true })
      .parse(highlightedCode)

    assert(codeAst.children.length === 1)
    const preElement = codeAst.children[0]!
    assert(preElement.type === `element` && preElement.tagName === `pre`)

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

const highlighterPromise = getHighlighter({ theme: `material-theme-palenight` })

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

const rehypeRemoveShikiClasses = (tree: HtmlRoot) => {
  visit(tree, { tagName: `pre` }, node => {
    const stack = [node]
    do {
      const node = stack.pop()!
      delete node.properties?.tabIndex
      delete node.properties?.className

      for (const child of node.children) {
        if (child.type === `element`) {
          stack.push(child)
        }
      }
    } while (stack.length > 0)
  })

  return tree
}

const convertMarkdownToText = (markdown: string): string =>
  String(
    unified()
      .use(remarkParse)
      .use(stripMarkdown)
      .use(remarkStringify)
      .processSync(markdown),
  )

const truncate = (text: string): string => {
  if (text.length <= MAX_LENGTH) {
    return text
  }

  for (let offset = 0; offset < 15; offset++) {
    if (/\s/u.test(text.charAt(MAX_LENGTH - offset))) {
      return `${text.slice(0, Math.max(0, MAX_LENGTH - offset))}…`
    }
  }

  return text.slice(0, Math.max(0, MAX_LENGTH))
}

const MAX_LENGTH = 200

const Section: Components[`section`] = props => {
  if (props[`data-footnotes`]) {
    return (
      <section
        {...props}
        className='prose-base border-t-2 border-y-gray-100 pt-4'
      />
    )
  }

  return <section {...props} />
}

const createHeading =
  <Type extends `h${1 | 2 | 3 | 4 | 5 | 6}`>(type: Type): Components[Type] =>
  props => {
    if (!(`id` in props) || props.id === `footnote-label`) {
      return createElement(type, props)
    }

    const { id, className, children, ...rest } = props

    return createElement(
      type,
      { id, className: clsx(className, `group relative`), ...rest },
      <Link
        href={`#${id}`}
        className='absolute top-1/2 h-6 w-6 -translate-x-[1.85rem] -translate-y-1/2 opacity-0 focus:opacity-100 group-hover:opacity-100'
      >
        <img
          src={linkSvgPath}
          className='m-0 h-6 w-6'
          // eslint-disable-next-line react/jsx-no-useless-fragment
          alt={`${renderToString(<>{children}</>)} permalink`}
        />
      </Link>,
      children,
    )
  }

const Anchor: Components[`a`] = ({
  'data-footnote-backref': dataFootnoteBackref,
  children,
  ...props
}) => {
  if (!dataFootnoteBackref) {
    return <a {...props}>{children}</a>
  }

  const { 'aria-label': ariaLabel, ...rest } = props
  return (
    <Tooltip content='Back to content'>
      {tooltipId => (
        <a
          {...rest}
          aria-labelledby={tooltipId}
          className='inline-block h-4 w-4 align-text-top no-underline hover:ring'
        >
          <img src={backToContentSvgPath} alt='' className='m-0 h-4 w-4' />
        </a>
      )}
    </Tooltip>
  )
}

const Pre: Components[`pre`] = ({ [`data-title`]: title, style, ...props }) => {
  if (title == null) {
    return <pre style={style} {...props} />
  }

  return (
    <>
      <div
        role='heading'
        aria-level={2}
        style={style}
        className='ml-5 inline-block translate-y-1 rounded-t-md px-3 pt-2 font-mono text-sm text-gray-100'
      >
        {String(title)}
      </div>
      <pre style={style} className='mt-0' {...props} />
    </>
  )
}

const components: Components = {
  section: Section,
  h1: createHeading(`h1`),
  h2: createHeading(`h2`),
  h3: createHeading(`h3`),
  h4: createHeading(`h4`),
  h5: createHeading(`h5`),
  h6: createHeading(`h6`),
  a: Anchor,
  pre: Pre,
}

const parseHrefPost = (
  metadata: Record<string, unknown>,
): Omit<HrefPost, `id` | `referencedBy`> => {
  const { hrefs, ...rest } = hrefPostMetadataSchema.parse(metadata)
  return { type: `href`, ...rest, references: parseReferences(hrefs) }
}

const stringSetSchema = z
  .array(z.string())
  .refine(strings => new Set(strings).size === strings.length)
  .transform(strings => new Set(strings.sort()))

const basePostMetadataSchema = z.object({
  title: z.string(),
  tags: stringSetSchema,
  dates: z.object({
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
})

const hrefPostMetadataSchema = basePostMetadataSchema.extend({
  href: z.string(),
  hrefs: stringSetSchema,
})

export default parsePost
