import type { Root } from 'hast'
import rehypeReact from 'rehype-react'
import type { ComponentType, ReactElement } from 'react'
import { Fragment, createElement } from 'react'
import { unified } from 'unified'
import { map, pipe, reduce, toObject } from 'lfi'
import { objectEntries, objectHasOwn } from 'ts-extras'
import { Link } from '../components/link.js'
import assert from './assert.js'

const renderHtml = (htmlAst: Root): ReactElement =>
  unified()
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: inflatedComponents,
    })
    .stringify(htmlAst)

const components: Partial<{
  [TagName in keyof JSX.IntrinsicElements]:
    | ComponentType<JSX.IntrinsicElements[TagName]>
    | {
        default: ComponentType<JSX.IntrinsicElements[TagName]>
        [className: string]: ComponentType<JSX.IntrinsicElements[TagName]>
      }
}> = {
  a: ({ ref, className, href, children, ...props }) => {
    assert(href)
    assert(children)

    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    )
  },
}

type Props = { className: string; [propName: string]: unknown }

const inflatedComponents = pipe(
  objectEntries(
    components as Record<
      string,
      | ComponentType<Props>
      | {
          default: ComponentType<Props>
          [className: string]: ComponentType<Props>
        }
    >,
  ),
  map(([name, value]): [string, ComponentType<Props>] => [
    name,
    `default` in value
      ? ({ className, ...rest }) => {
          let Component = value.default

          if (!className) {
            return <Component className={className} {...rest} />
          }

          const classNames = className.trim().split(/\s+/u)
          const classNameIndex = classNames.findIndex(className =>
            objectHasOwn(value, className),
          )

          if (classNameIndex === -1) {
            return <Component className={className} {...rest} />
          }

          Component = value[classNames[classNameIndex]!]!
          classNames.splice(classNameIndex, 1)
          return <Component className={classNames.join(` `)} {...rest} />
        }
      : value,
  ]),
  reduce(toObject()),
) as Partial<{
  [TagName in keyof JSX.IntrinsicElements]: ComponentType<
    JSX.IntrinsicElements[TagName]
  >
}>

export default renderHtml
