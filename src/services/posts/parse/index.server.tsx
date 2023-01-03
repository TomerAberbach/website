import readingTime from 'reading-time'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import { createElement, useId } from 'react'
import clsx from 'clsx'
import type { Root } from 'hast'
import remarkParse from 'remark-parse'
import { z } from 'zod'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import parseFrontMatter from 'gray-matter'
import { unified } from 'unified'
import { getHighlighter } from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkSmartypants from 'remark-smartypants'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/solid'
import type { HrefPost, MarkdownPost, Post } from '../types.js'
import type { RawPost } from '../fetch.server.js'
import { renderHtml } from '../../html.js'
import type { Components } from '../../html.js'
import { Link } from '../../../components/link.js'
import Tooltip from '../../../components/tooltip.js'
import { parseHrefs, parseReferences } from './references.server.js'

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

export default parsePost

const parseMarkdownPost = async (
  content: string,
  metadata: Record<string, unknown>,
): Promise<Omit<MarkdownPost, `id` | `referencedBy`>> => {
  const htmlAst = await parseMarkdown(content)

  return {
    type: `markdown`,
    ...basePostMetadataSchema.parse(metadata),
    references: parseReferences(parseHrefs(htmlAst)),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    content: renderToStaticMarkup(renderHtml(htmlAst, components)),
  }
}

const parseMarkdown = async (markdown: string): Promise<Root> =>
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkSmartypants)
      .use(remarkA11yEmoji)
      .use(remarkEmbedder, { transformers: [remarkTransformerOembed] })
      .use(remarkMath)
      .use(remarkRehype, { clobberPrefix: `` })
      .use(rehypeExternalLinks)
      .use(rehypeSlug)
      .use(rehypeShiki, { highlighter: await highlighterPromise })
      .use(() => rehypeRemoveShikiClasses)
      .use(rehypeKatex)
      .use(rehypePresetMinify)
      // eslint-disable-next-line no-restricted-syntax
      .use(function () {
        // eslint-disable-next-line typescript/no-invalid-this
        this.Compiler = htmlAst => htmlAst
      })
      .process(markdown)
  ).result as Root

const highlighterPromise = getHighlighter({ theme: `material-palenight` })

const rehypeRemoveShikiClasses = (tree: Root) => {
  visit(tree, { tagName: `pre` }, node => {
    const stack = [node]
    do {
      const node = stack.pop()!
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
          src='/link.svg'
          className='m-0'
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
  const tooltipId = useId()

  if (!dataFootnoteBackref) {
    return <a {...props}>{children}</a>
  }

  const { 'aria-label': ariaLabel, ...rest } = props
  return (
    <Tooltip id={tooltipId} className='h-full' content='Back to content'>
      <a
        {...rest}
        aria-labelledby={tooltipId}
        className='peer inline-block h-4 w-4 align-text-top no-underline hover:ring'
      >
        <ArrowUturnLeftIcon className='h-full stroke-gray-400' />
      </a>
    </Tooltip>
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
  timestamp: z.preprocess(
    value => (typeof value === `string` ? new Date(value) : value),
    z.date(),
  ),
})

const hrefPostMetadataSchema = basePostMetadataSchema.extend({
  href: z.string(),
  hrefs: stringSetSchema,
})