import { htmlEscape } from 'escape-goat'
import { isSelfClosingTag } from './tags'
import { isElement } from './index'

const render = ({ tag, attributes, children }) => {
  let code = `<${tag}`

  for (const [name, value] of Object.entries(attributes)) {
    if (value == null) {
      continue
    }

    code += ` ${name}="${htmlEscape(String(value))}"`
  }

  code += `>`

  if (isSelfClosingTag(tag)) {
    return code
  }

  for (const child of children) {
    for (const grandchild of [].concat(child)) {
      if (grandchild == null) {
        continue
      }

      code += isElement(grandchild)
        ? render(grandchild)
        : htmlEscape(String(grandchild))
    }
  }

  code += `</${tag}>`
  return code
}

export default render
