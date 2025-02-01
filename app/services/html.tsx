import type { Root } from 'hast'
import rehypeReact from 'rehype-react'
import type { Options } from 'rehype-react'
import type { ComponentType, ReactElement } from 'react'
import { unified } from 'unified'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

export const renderHtml = (
  htmlAst: Root,
  components: Components,
): ReactElement =>
  unified()
    .use(rehypeReact, {
      Fragment,
      development: false,
      jsx,
      jsxs,
      components,
    } as Options)
    .stringify(htmlAst)

export type Components = Partial<{
  [TagName in keyof JSX.IntrinsicElements]:
    | keyof JSX.IntrinsicElements
    | ComponentType<
        JSX.IntrinsicElements[TagName] &
          Partial<Record<`data-${string}`, unknown>>
      >
}>
