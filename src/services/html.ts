import type { Root } from 'hast'
import rehypeReact from 'rehype-react'
import type { ComponentType, ReactElement } from 'react'
import { Fragment, createElement } from 'react'
import { unified } from 'unified'

const renderHtml = (
  htmlAst: Root,
  components?: Partial<{
    [TagName in keyof JSX.IntrinsicElements]:
      | keyof JSX.IntrinsicElements
      | ComponentType<JSX.IntrinsicElements[TagName]>
  }>,
): ReactElement =>
  unified()
    .use(rehypeReact, { createElement, Fragment, components })
    .stringify(htmlAst)

export default renderHtml
