import type { Root } from 'hast'
import { h } from 'hastscript'
import { SKIP, visit } from 'unist-util-visit'

/**
 * Wrap each `<table>` in a horizontally scrollable container. Replaces the
 * `Table` override from `render-post.server.tsx`.
 */
const rehypeTableWrapper =
  () =>
  (tree: Root): void => {
    visit(tree, `element`, (node, index, parent) => {
      if (node.tagName !== `table` || parent == null || index == null) {
        return
      }

      parent.children[index] = h(`div`, { class: `overflow-auto` }, node)
      return [SKIP, index + 1]
    })
  }

export default rehypeTableWrapper
