/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import type { Root } from 'hast'
import type { ComponentType, JSX, ReactElement } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import rehypeReact from 'rehype-react'
import type { Options } from 'rehype-react'
import { unified } from 'unified'

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
