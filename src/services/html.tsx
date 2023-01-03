import type { Root } from 'hast'
import rehypeReact from 'rehype-react'
import type { ComponentType, ReactElement } from 'react'
import { Fragment, createElement } from 'react'
import { unified } from 'unified'

export const renderHtml = (
  htmlAst: Root,
  components: Components,
): ReactElement =>
  unified()
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: components as Partial<{
        [TagName in keyof JSX.IntrinsicElements]:
          | keyof JSX.IntrinsicElements
          | ComponentType<JSX.IntrinsicElements[TagName]>
      }>,
    })
    .stringify(htmlAst)

export type Components = Partial<{
  [TagName in keyof JSX.IntrinsicElements]:
    | keyof JSX.IntrinsicElements
    | ComponentType<
        JSX.IntrinsicElements[TagName] &
          Partial<Record<`data-${string}`, unknown>>
      >
}>
