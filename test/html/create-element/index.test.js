import { testProp, fc } from 'ava-fast-check'
import { isTag } from 'html/create-element/tags'
import { createElement, isElement } from 'html/create-element'
import { childrenArb, elementArb } from './arbitraries'
import { selfClosingTagArb } from './tags/arbitraries'
import { attributesArb } from './attributes/arbitraries'

testProp(
  `createElement throws on invalid tag`,
  [
    fc.string().filter(string => !isTag(string)),
    attributesArb(),
    childrenArb(4)
  ],
  (t, tag, attributes, children) => {
    t.throws(() => createElement(tag, attributes, ...children))
  }
)

testProp(
  `createElement throws on self closing tag with children`,
  [
    selfClosingTagArb(),
    attributesArb(),
    childrenArb(4).filter(children => children.length > 0)
  ],
  (t, tag, attributes, children) => {
    t.throws(() => createElement(tag, attributes, ...children))
  }
)

testProp(`createElement returns elements`, [elementArb(4)], (t, element) => {
  t.true(isElement(element))
})
