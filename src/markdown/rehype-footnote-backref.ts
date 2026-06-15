import type { Root } from 'hast'
import { visit } from 'unist-util-visit'
import { classList, cx } from './classes.ts'

/**
 * Style the footnotes `<section>` and give each footnote backref a focus ring,
 * preserving the default `↩` glyph. Replaces the `Section` and backref `Anchor`
 * overrides from `render-post.server.tsx`.
 */
const rehypeFootnoteBackref =
  () =>
  (tree: Root): void => {
    visit(tree, `element`, node => {
      if (node.tagName === `section` && `dataFootnotes` in node.properties) {
        node.properties.className = cx(
          `prose-base border-t-2 border-y-gray-100 pt-4`,
        )
        return
      }

      if (node.tagName !== `a` || !(`dataFootnoteBackref` in node.properties)) {
        return
      }

      node.properties.className = cx(
        ...classList(node.properties.className),
        `focus-ring`,
      )
    })
  }

export default rehypeFootnoteBackref
