import type { Element, Root } from 'hast'
import { h } from 'hastscript'
import { visit } from 'unist-util-visit'
import { cx } from './classes.ts'

const COLOR_CLASSES: Readonly<
  Record<string, { readonly div: string; readonly img: string }>
> = {
  blue: {
    div: `border-l-blue-500 bg-blue-50`,
    img: `border-blue-50 bg-blue-50`,
  },
  yellow: {
    div: `border-l-yellow-500 bg-yellow-100`,
    img: `border-yellow-100 bg-yellow-100`,
  },
}

/**
 * Transform `remark-admonition`'s `data-admonition-*` divs into bordered cards
 * with an icon and label. Replaces the `Div` override from
 * `render-post.server.tsx`.
 */
const rehypeAdmonition =
  () =>
  (tree: Root): void => {
    visit(tree, `element`, (node: Element) => {
      if (node.tagName !== `div`) {
        return
      }

      const {
        dataAdmonitionName: name,
        dataAdmonitionLabel: label,
        dataAdmonitionIconUrl: iconUrl,
        dataAdmonitionColor: color,
        ...rest
      } = node.properties
      if (name == null) {
        return
      }

      const colorClasses =
        typeof color === `string` ? COLOR_CLASSES[color] : undefined
      const body = node.children

      node.properties = {
        ...rest,
        className: cx(
          `relative my-10 rounded-md border-l-4 p-8`,
          colorClasses?.div,
        ),
      }
      node.children = [
        h(`img`, {
          src: String(iconUrl),
          alt: ``,
          class: cx(
            `not-prose absolute top-0 left-0 m-0 box-content size-9 -translate-x-1/2 translate-y-[-45%] rounded-full border-4`,
            colorClasses?.img,
          ),
        }),
        ...(typeof label === `string`
          ? [
              h(
                `header`,
                { class: `pb-2 text-base font-semibold uppercase` },
                label,
              ),
            ]
          : []),
        h(`div`, { class: `*:first:mt-0 *:last:mb-0` }, body),
      ]
    })
  }

export default rehypeAdmonition
