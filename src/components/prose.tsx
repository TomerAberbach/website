import { unified } from 'unified'
import rehypeParse from 'rehype-parse-isomorphic'
import { invariant } from '@epic-web/invariant'
import { renderHtml } from '~/services/render-html'
import type { Components } from '~/services/render-html'
import { Link } from '~/components/link.tsx'

const Prose = ({ html }: { html: string }) =>
  renderHtml(htmlParser.parse(html), components)

const htmlParser = unified().use(rehypeParse, { fragment: true }).freeze()

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
