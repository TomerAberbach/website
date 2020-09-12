import test from 'ava'
import { testProp } from 'ava-fast-check'
import { elementArb } from './arbitraries'
import render from './render'
import traverse from './traverse'

testProp(`render returns a string`, [elementArb(4)], (t, element) => {
  t.true(typeof render(element) === `string`)
})

testProp(
  `render returns a string containing the tags of all elements in the tree`,
  [elementArb(4)],
  (t, element) => {
    const code = render(element)

    traverse(element, ({ tag }) => {
      t.true(code.indexOf(tag) !== -1)
    })
  }
)

test(`render concrete example`, t => {
  t.is(render(<h1>Hello World!</h1>), `<h1>Hello World!</h1>`)
})
