import { testProp, fc } from 'ava-fast-check'
import {
  attributesArb,
  childrenArb,
  elementArb,
  selfClosingTagArb
} from './arbitraries'
import { tags } from 'html/tags'
import { createElement, isElement } from 'html'

testProp(
  `createElement throws on invalid tag`,
  [
    fc.string().filter(string => !tags.has(string)),
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
