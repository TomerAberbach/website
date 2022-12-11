import type { Root } from 'hast'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeExternalLinks from 'rehype-external-links'
import { unified } from 'unified'
import { getHighlighter } from 'shiki'
import rehypeShiki from '@leafac/rehype-shiki'
import rehypePresetMinify from 'rehype-preset-minify'
import { visit } from 'unist-util-visit'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkEmbedder from '@remark-embedder/core'
import remarkTransformerOembed from '@remark-embedder/transformer-oembed'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkSmartypants from 'remark-smartypants'
import { h } from 'hastscript'
import { toString } from 'hast-util-to-string'

const parseMarkdown = async (markdown: string): Promise<Root> =>
  (
    await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkSmartypants)
      .use(remarkA11yEmoji)
      .use(remarkEmbedder, { transformers: [remarkTransformerOembed] })
      .use(remarkMath)
      .use(remarkRehype)
      .use(rehypeExternalLinks)
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: `prepend`,
        properties: {},
        content: node =>
          h(`img`, {
            alt: `${toString(node)} permalink`,
            src: `/link.svg`,
            class: `m-0`,
          }),
      })
      .use(rehypeShiki, { highlighter: await highlighterPromise })
      .use(() => rehypeRemoveShikiClasses)
      .use(rehypeKatex)
      .use(rehypePresetMinify)
      // eslint-disable-next-line no-restricted-syntax
      .use(function () {
        // eslint-disable-next-line typescript/no-invalid-this
        this.Compiler = htmlAst => htmlAst
      })
      .process(markdown)
  ).result as Root

const highlighterPromise = getHighlighter({ theme: `material-palenight` })

const rehypeRemoveShikiClasses = (tree: Root) => {
  visit(tree, { tagName: `pre` }, node => {
    const stack = [node]
    do {
      const node = stack.pop()!
      delete node.properties?.className

      for (const child of node.children) {
        if (child.type === `element`) {
          stack.push(child)
        }
      }
    } while (stack.length > 0)
  })

  return tree
}

export default parseMarkdown
