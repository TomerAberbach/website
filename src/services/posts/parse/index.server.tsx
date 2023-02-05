import readingTime from 'reading-time'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import clsx from 'clsx'
import type { Root } from 'hast'
import remarkParse from 'remark-parse'
import { z } from 'zod'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import remarkStringify from 'remark-stringify'
import parseFrontMatter from 'gray-matter'
import { unified } from 'unified'
import { getHighlighter } from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'
import stripMarkdown from 'strip-markdown'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import type { RemarkEmbedderOptions } from '@remark-embedder/core'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import RemarkEmbedderCache from '@remark-embedder/cache'
import remarkSmartypants from 'remark-smartypants'
import { ArrowUturnLeftIcon } from '@heroicons/react/24/solid'
import isCI from 'is-ci'
import { parseHrefs, parseReferences } from './references.server.js'
import type { HrefPost, MarkdownPost, Post } from '~/services/posts/types.js'
import type { RawPost } from '~/services/posts/read.server.js'
import { renderHtml } from '~/services/html.js'
import type { Components } from '~/services/html.js'
import { Link } from '~/components/link.js'
import Tooltip from '~/components/tooltip.js'

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

const convertMarkdownToHtml = async (markdown: string): Promise<Root> =>
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkSmartypants)
      .use(remarkA11yEmoji)
      .use(remarkEmbedder, {
        cache: remarkEmbedderCache as unknown as RemarkEmbedderOptions[`cache`],
        // Oembed.com requests fail on GitHub Actions
        transformers: isCI ? [] : [remarkTransformerOembed],
      })
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

const remarkEmbedderCache = new RemarkEmbedderCache()
const highlighterPromise = getHighlighter({ theme: `material-theme-palenight` })

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
          <ArrowUturnLeftIcon className='h-full stroke-gray-400' />
        </a>
      )}
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
