import { unified } from 'unified'
import { useHydrated } from 'remix-utils/use-hydrated'
import rehypeDomParse from 'rehype-dom-parse'
import { invariant } from '@epic-web/invariant'
import { renderHtml } from '~/services/html.tsx'
import type { Components } from '~/services/html.tsx'
import { Link } from '~/components/link.tsx'

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
    invariant(href, `Expected href`)
    invariant(children, `Expected children`)

    return (
      <Link href={href} {...props} reloadDocument={href.endsWith(`.css`)}>
        {children}
      </Link>
    )
  },
}

export default Prose
