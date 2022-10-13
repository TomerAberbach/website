import type { ComponentType } from 'react'
import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import renderHtml from '../services/html'
import assert from '../services/assert.js'
import { Link } from './link.js'

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
    a: ({ ref, href, children, ...props }) => {
      assert(href)
      assert(children)

      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      )
    },
    ...components,
  })
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()
