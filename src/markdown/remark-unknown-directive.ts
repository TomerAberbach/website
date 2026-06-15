import type { Root, RootContent } from 'mdast'
import { SKIP, visit } from 'unist-util-visit'
import 'mdast-util-directive'

/**
 * Turn unhandled text and leaf directives back into the literal text they were
 * parsed from.
 *
 * `remark-directive` treats `:name` as an inline directive, so an inline time
 * like `11:00pm` parses as the text `11` followed by a `:00pm` directive. When
 * nothing handles that directive it's dropped on the way to HAST (and rendered
 * as an empty block), silently eating the time. Reconstructing the source keeps
 * such accidental directives as plain text.
 *
 * Must run *after* every plugin that consumes directives (`remarkFlex`,
 * `remarkGif`, `remarkAudio`, `remarkAdmonition`); those mark the nodes they
 * handle with `data.hName`, which is how we tell handled from unhandled.
 */
const remarkUnknownDirective =
  () =>
  (tree: Root): void => {
    visit(
      tree,
      [`textDirective`, `leafDirective`] as const,
      (node, index, parent) => {
        if (parent == null || index == null || node.data?.hName != null) {
          return
        }

        const marker = node.type === `leafDirective` ? `::` : `:`
        const replacement: RootContent[] = [
          { type: `text`, value: `${marker}${node.name}` },
        ]
        if (node.children.length > 0) {
          replacement.push(
            { type: `text`, value: `[` },
            ...node.children,
            { type: `text`, value: `]` },
          )
        }
        const attributes = Object.entries(node.attributes ?? {})
        if (attributes.length > 0) {
          const serialized = attributes
            .map(([key, value]) => (value === `` ? key : `${key}="${value}"`))
            .join(` `)
          replacement.push({ type: `text`, value: `{${serialized}}` })
        }

        // `parent.children` is a union of node-array types; splicing in the
        // mixed reconstruction needs a single concrete element type.
        ;(parent.children as RootContent[]).splice(index, 1, ...replacement)
        return [SKIP, index + replacement.length]
      },
    )
  }

export default remarkUnknownDirective
