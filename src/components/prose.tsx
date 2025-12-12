import { invariant } from '@epic-web/invariant'
import { useLayoutEffect, useRef } from 'react'
import rehypeParse from 'rehype-parse-isomorphic'
import { unified } from 'unified'
import { Link } from '~/components/link.tsx'
import { renderHtml } from '~/services/render-html.tsx'
import type { Components } from '~/services/render-html.tsx'

const Prose = ({ html }: { html: string }) =>
  renderHtml(htmlParser.parse(html), components)

const htmlParser = unified().use(rehypeParse, { fragment: true }).freeze()

const Details: Components[`details`] = props => {
  const ref = useRef<HTMLDetailsElement>(null)
  useLayoutEffect(() => {
    const detailsElement = ref.current
    if (!detailsElement) {
      return
    }
    if (!location.hash) {
      return
    }

    const targetElement = detailsElement.querySelector(location.hash)
    if (!targetElement) {
      return
    }

    detailsElement.open = true
    targetElement.scrollIntoView()
  }, [])

  return <details ref={ref} {...props} />
}

const components: Components = {
  a: ({ ref, href, children, ...props }) => {
    invariant(href, `Expected href`)
    invariant(children, `Expected children`)

    return (
      <Link href={href} {...props} reloadDocument={href.endsWith(`.css`)}>
        {children}
      </Link>
    )
  },
  details: Details,
}

export default Prose
