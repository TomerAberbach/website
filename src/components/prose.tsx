import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import { renderHtml } from '../services/html.js'
import type { Components } from '../services/html.js'
import { Link } from '../components/link.js'
import assert from '../services/assert.js'

const Prose = ({ html }: { html: string }) => {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return renderHtml(htmlParser.parse(html), components)
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()

const components: Components = {
  a: ({ ref, href, children, ...props }) => {
    assert(href)
    assert(children)

    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  },
}

export default Prose
