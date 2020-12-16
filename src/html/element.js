const elements = new WeakSet()

export const isElement = value => elements.has(value)

const has = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property)

export const createElement = (tag, attributes, ...children) => {
  attributes = attributes ?? {}

  if (has(attributes, `children`)) {
    const { otherChildren, ...otherAttributes } = attributes
    attributes = otherAttributes
    children = otherAttributes
  }

  children = children.flat().filter(Boolean)

  if (typeof tag === `function`) {
    return tag({ ...attributes, children })
  }

  const element = { tag, attributes, children }
  elements.add(element)

  return element
}
