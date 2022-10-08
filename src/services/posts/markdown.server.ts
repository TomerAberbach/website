import type { Root } from 'hast'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import { unified } from 'unified'
import { getHighlighter } from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'
import rehypePresetMinify from 'rehype-preset-minify'

export default async function parseMarkdown(markdown: string): Promise<Root> {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeExternalLinks)
    .use(rehypeShiki, { highlighter: await highlighterPromise })
    .use(rehypePresetMinify)
    .use(function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.Compiler = htmlAst => htmlAst
    })
    .processSync(markdown).result as Root
}

const highlighterPromise = getHighlighter({ theme: `light-plus` })
