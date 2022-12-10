import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import renderHtml from '../services/html.js'

const Prose = ({ html }: { html: string }) => {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return renderHtml(htmlParser.parse(html))
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()

export default Prose
