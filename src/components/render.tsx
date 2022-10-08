import type { ComponentType } from 'react'
import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import { Link } from '@remix-run/react'
import renderHtml from '../services/html'

export default function Render({
  html,
  components,
}: {
  html: string
  components?: Partial<{
    [TagName in keyof JSX.IntrinsicElements]:
      | keyof JSX.IntrinsicElements
      | ComponentType<JSX.IntrinsicElements[TagName]>
  }>
}) {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return renderHtml(htmlParser.parse(html), {
    a: ({ rel, href, ref, ...props }) =>
      !rel && href ? (
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        <Link {...props} to={href} />
      ) : (
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        <a rel={rel} href={href} {...props} />
      ),
    ...components,
  })
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()
