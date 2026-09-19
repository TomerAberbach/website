import { invariant } from '@epic-web/invariant'
import { renderToString } from 'react-dom/server'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import type { Components } from './render-html.tsx'
import { renderHtml } from './render-html.tsx'
import { Link } from '~/components/link.tsx'

/**
 * Renders a post's HTML for its page, with links rendered through the site's
 * link component so that external ones open in a new tab.
 */
export const renderProse = (html: string): string =>
  renderToString(renderHtml(htmlParser.parse(html), components))

const htmlParser = unified().use(rehypeParse, { fragment: true }).freeze()

const components: Components = {
  // eslint-disable-next-line id-length
  a: ({ ref, href, children, ...props }) => {
    invariant(href, `Expected href`)
    invariant(children, `Expected children`)

    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  },
}
