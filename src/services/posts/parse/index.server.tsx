import readingTime from 'reading-time'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import clsx from 'clsx'
import { z } from 'zod'
import parseFrontMatter from 'gray-matter'
import { parseHrefs, parseReferences } from './references.server.ts'
import linkSvgPath from './images/link.svg'
import backToContentSvgPath from './images/back-to-content.svg'
import {
  convertMarkdownToHtml,
  convertMarkdownToText,
} from './convert.server.tsx'
import type { HrefPost, MarkdownPost, Post } from '~/services/posts/types.ts'
import type { RawPost } from '~/services/posts/read.server.ts'
import { renderHtml } from '~/services/html.tsx'
import type { Components } from '~/services/html.tsx'
import { Link } from '~/components/link.tsx'
import Tooltip from '~/components/tooltip.tsx'

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

const Div: Components[`div`] = ({
  'data-admonition-name': admonitionName,
  'data-admonition-label': admonitionLabel,
  'data-admonition-icon-url': admonitionIconUrl,
  'data-admonition-color': admonitionColor,
  children,
  ...props
}) => {
  if (!admonitionName) {
    return <div {...props}>{children}</div>
  }

  let divColorClass
  let imgColorClass
  switch (admonitionColor) {
    case `blue`:
      divColorClass = `border-l-blue-500 bg-blue-50`
      imgColorClass = `border-blue-50 bg-blue-50`
      break
    case `yellow`:
      divColorClass = `border-l-yellow-500 bg-yellow-100`
      imgColorClass = `border-yellow-100 bg-yellow-100`
      break
  }

  return (
    <div
      className={clsx(
        `relative my-10 rounded-md border-l-4 p-8`,
        divColorClass,
      )}
      {...props}
    >
      <img
        src={String(admonitionIconUrl)}
        alt=''
        className={clsx(
          `not-prose absolute left-0 top-0 m-0 box-content h-9 w-9 -translate-x-1/2 -translate-y-[45%] rounded-full border-4`,
          imgColorClass,
        )}
      />
      {admonitionLabel ? (
        <header className='pb-2 text-base font-semibold uppercase'>
          {String(admonitionLabel)}
        </header>
      ) : null}
      <div className='first:*:mt-0 last:*:mb-0'>{children}</div>
    </div>
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
  div: Div,
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
