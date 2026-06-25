import type { Element, Root } from 'hast'
import { toHtml } from 'hast-util-to-html'
import { h } from 'hastscript'
import { visit } from 'unist-util-visit'
import { classList, cx } from './classes.ts'
import linkSvgPath from '~/assets/media/link.svg?url'

const HEADING_TAG_NAMES = new Set([`h1`, `h2`, `h3`, `h4`, `h5`, `h6`])

/**
 * Give id'd headings (except the footnotes label) a hover-revealed permalink
 * anchor. Replaces the `createHeading` override from `render-post.server.tsx`.
 */
const rehypeHeadingAnchors =
  () =>
  (tree: Root): void => {
    visit(tree, `element`, (node: Element) => {
      if (!HEADING_TAG_NAMES.has(node.tagName)) {
        return
      }

      const { id, className } = node.properties
      if (typeof id !== `string` || id === `footnote-label`) {
        return
      }

      const alt = `${toHtml(node.children)} permalink`
      node.properties.className = cx(...classList(className), `group relative`)
      node.children.unshift(
        h(
          `a`,
          {
            href: `#${id}`,
            class: `absolute top-1/2 size-6 translate-x-[-1.85rem] -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 in-[summary]:translate-x-[-3.35rem] focus-ring`,
          },
          h(`img`, { src: linkSvgPath, class: `not-prose m-0 size-6`, alt }),
        ),
      )
    })
  }

export default rehypeHeadingAnchors
