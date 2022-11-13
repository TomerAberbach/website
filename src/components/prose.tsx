import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import { Link } from '../components/link.js'
import renderHtml from '../services/html.js'
import assert from '../services/assert.js'

const Prose = ({ html }: { html: string }) => {
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
  })
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()

export default Prose
