import type { Root } from 'hast'
import rehypeReact from 'rehype-react'
import type { ComponentType, ReactElement } from 'react'
import { Fragment, createElement } from 'react'
import { unified } from 'unified'
import { map, pipe, reduce, toObject } from 'lfi'
import { objectEntries, objectHasOwn } from 'ts-extras'

export const renderHtml = (
  htmlAst: Root,
  components: Components = {},
): ReactElement =>
  unified()
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: inflateComponents(components),
    })
    .stringify(htmlAst)

const inflateComponents = (components: Components) =>
  pipe(
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

export type Components = Partial<{
  [TagName in keyof JSX.IntrinsicElements]:
    | ComponentType<JSX.IntrinsicElements[TagName]>
    | {
        default: ComponentType<JSX.IntrinsicElements[TagName]>
        [className: string]: ComponentType<JSX.IntrinsicElements[TagName]>
      }
}>

type Props = { className: string; [propName: string]: unknown }
