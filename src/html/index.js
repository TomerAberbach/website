import assert from 'assert'
import { tags, selfClosingTags } from './tags'

const elements = new WeakSet()

export const isElement = value => elements.has(value)

export const createElement = (tag, attributes, ...children) => {
  attributes = attributes ?? {}

  if (typeof tag === `function`) {
    return tag({ ...attributes, children })
  }

  assert(tags.has(tag))
  assert(children.length === 0 || !selfClosingTags.has(tag))

  for (const [name, value] of Object.entries(attributes)) {
    assert(typeof name === `string`)
    assert(
      value == null || [`string`, `number`, `boolean`].includes(typeof value)
    )
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
