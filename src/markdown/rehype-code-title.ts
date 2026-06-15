import type { Root } from 'hast'
import { h } from 'hastscript'
import { SKIP, visit } from 'unist-util-visit'

/**
 * Pull a `title=` code fence meta value (surfaced by the Shiki transformer as a
 * `data-title` attribute) into a heading bar above the `<pre>`. Replaces the
 * `Pre` override from `render-post.server.tsx`.
 */
const rehypeCodeTitle =
  () =>
  (tree: Root): void => {
    visit(tree, `element`, (node, index, parent) => {
      if (node.tagName !== `pre` || parent == null || index == null) {
        return
      }

      const title = node.properties[`data-title`] ?? node.properties.dataTitle
      if (typeof title !== `string`) {
        return
      }

      const { style } = node.properties
      delete node.properties[`data-title`]
      delete node.properties.dataTitle
      node.properties.className = [`mt-0`]

      const titleBar = h(
        `div`,
        {
          role: `heading`,
          'aria-level': 2,
          style,
          class: `ml-5 inline-block translate-y-1 rounded-t-md px-3 pt-2 font-mono text-sm text-gray-100`,
        },
        title,
      )
      parent.children.splice(index, 1, titleBar, node)
      return [SKIP, index + 2]
    })
  }

export default rehypeCodeTitle
