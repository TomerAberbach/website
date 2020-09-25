import htmlElementAttributes from 'html-element-attributes'
import svgElementAttributes from 'svg-element-attributes'
import ariaAttributes from 'aria-attributes'
import { tags } from '../tags'

export const genericAttributeNames = new Set(
  [].concat(
    htmlElementAttributes[`*`],
    svgElementAttributes[`*`],
    ariaAttributes
  )
)

export const attributeNamesByTag = new Map(
  (function* () {
    for (const tag of tags) {
      for (const object of [htmlElementAttributes, svgElementAttributes]) {
        if (tag in object) {
          yield [tag, new Set(object[tag])]
        }
      }
    }
  })()
)

export const isAttributeName = ({ value, tag }) =>
  genericAttributeNames.has(value) ||
  (attributeNamesByTag.get(tag)?.has(value) ?? false)
