import { isElement } from './create-element'

const traverse = (element, fn) => {
  const stack = [element]
  do {
    const current = stack.pop()
    fn(current)

    for (const child of current.children) {
      if (isElement(child)) {
        stack.push(child)
      }
    }
  } while (stack.length > 0)
}

export default traverse
