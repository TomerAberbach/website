import assert from 'assert'
import { isTag, isSelfClosingTag } from './tags'
import { isAttribute } from './attributes'

const elements = new WeakSet()

export const isElement = value => elements.has(value)

export const createElement = (tag, attributes, ...children) => {
  attributes = attributes ?? {}

  if (typeof tag === `function`) {
    return tag({ ...attributes, children })
  }

  assert(isTag(tag))
  assert(children.length === 0 || !isSelfClosingTag(tag))

  for (const attribute of Object.entries(attributes)) {
    assert(isAttribute(attribute))
  }

  for (const child of children) {
    for (const grandchild of [].concat(child)) {
      assert(
        elements.has(grandchild) ||
          grandchild == null ||
          [`string`, `number`].includes(typeof grandchild)
      )
    }
  }

  const element = { tag, attributes, children }
  elements.add(element)

  return element
}
