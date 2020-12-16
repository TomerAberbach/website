import selfClosingTagsArray from 'self-closing-tags'
import { htmlEscape } from 'escape-goat'
import { isElement } from './element.js'

const selfClosingTags = new Set(selfClosingTagsArray)

const renderAttributes = attributes => {
  let html = ``

  for (let [name, value] of Object.entries(attributes)) {
    if (value === false) {
      continue
    }

    if (
      typeof value !== `string` &&
      typeof value[Symbol.iterator] === `function`
    ) {
      value = [...value].join(` `)
    }

    let attribute = `${htmlEscape(name)}`

    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`
    }

    html += ` ${attribute}`
  }

  return html
}

const renderChildren = children => {
  let html = ``

  for (const child of children) {
    html += isElement(child) ? render(child) : htmlEscape(String(child))
  }

  return html
}

const render = ({ tag, attributes, children }) => {
  let html = ``

  if (tag != null) {
    html += `<${tag}${renderAttributes(attributes)}>`
  }

  html += `${renderChildren(children)}`

  if ((tag != null && children.length > 0) || !selfClosingTags.has(tag)) {
    html += `</${tag}>`
  }

  return html
}

export default render
