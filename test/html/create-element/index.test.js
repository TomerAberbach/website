import { testProp, fc } from 'ava-fast-check'
import {
  attributesArb,
  childrenArb,
  elementArb,
  selfClosingTagArb
} from './arbitraries'
import { isTag } from 'html/create-element/tags'
import { createElement, isElement } from 'html/create-element'

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
