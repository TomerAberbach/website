import clsx from 'clsx'
import type { Root as HtmlRoot } from 'hast'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import linkSvgPath from './images/link.svg'
import backToContentSvgPath from './images/back-to-content.svg'
import type { Components } from './render-html.tsx'
import { renderHtml } from './render-html.tsx'
import { Link } from '~/components/link.tsx'
import Tooltip from '~/components/tooltip.tsx'

export const renderPost = (htmlAst: HtmlRoot): string =>
  renderToString(renderHtml(htmlAst, components))

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
        className='absolute top-1/2 size-6 -translate-x-[1.85rem] -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100'
      >
        <img
          src={linkSvgPath}
          className='not-prose m-0 size-6'
          // eslint-disable-next-line react/jsx-no-useless-fragment
          alt={`${renderToString(<>{children}</>)} permalink`}
        />
      </Link>,
      children,
    )
  }

const Table: Components[`table`] = props => (
  <div className='overflow-auto'>
    <table {...props} />
  </div>
)

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
          className='inline-block size-4 align-text-top no-underline hover:ring-3'
        >
          <img src={backToContentSvgPath} alt='' className='m-0 size-4' />
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
          `not-prose absolute top-0 left-0 m-0 box-content size-9 -translate-x-1/2 -translate-y-[45%] rounded-full border-4`,
          imgColorClass,
        )}
      />
      {typeof admonitionLabel === `string` ? (
        <header className='pb-2 text-base font-semibold uppercase'>
          {admonitionLabel}
        </header>
      ) : null}
      <div className='*:first:mt-0 *:last:mb-0'>{children}</div>
    </div>
  )
}

const Pre: Components[`pre`] = ({ [`data-title`]: title, style, ...props }) => {
  if (typeof title !== `string`) {
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
        {title}
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
  table: Table,
  a: Anchor,
  div: Div,
  pre: Pre,
}
