import { unified } from 'unified'
import { useHydrated } from 'remix-utils/use-hydrated'
import rehypeDomParse from 'rehype-dom-parse'
import { renderHtml } from '~/services/html.tsx'
import type { Components } from '~/services/html.tsx'
import { Link } from '~/components/link.tsx'
import assert from '~/services/assert.ts'

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
      <Link href={href} {...props} reloadDocument={href.endsWith(`.css`)}>
        {children}
      </Link>
    )
  },
}

export default Prose
