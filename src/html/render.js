import createHtmlElement from 'create-html-element'
import { htmlEscape } from 'escape-goat'
import { isElement } from './index'

const render = ({ tag, attributes, children }) => {
  let html = ``

  for (const child of children) {
    for (const grandchild of [].concat(child)) {
      if (grandchild == null) {
        continue
      }

      html += isElement(grandchild)
        ? render(grandchild)
        : htmlEscape(String(grandchild))
    }
  }

  return createHtmlElement({
    name: tag,
    attributes,
    html
  })
}

export default render
