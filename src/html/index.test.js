import { testProp, fc } from 'ava-fast-check'
import {
  attributesArb,
  childrenArb,
  elementArb,
  selfClosingTagArb
} from './arbitraries'
import { isTag } from './tags'
import { html, isElement } from './index'

testProp(
  `html throws on invalid tag`,
  [
    fc.string().filter(string => !isTag(string)),
    attributesArb(),
    childrenArb(4)
  ],
  (t, tag, attributes, children) => {
    t.throws(() => html(tag, attributes, ...children))
  }
)

testProp(
  `html throws on self closing tag with children`,
  [
    selfClosingTagArb(),
    attributesArb(),
    childrenArb(4).filter(children => children.length > 0)
  ],
  (t, tag, attributes, children) => {
    t.throws(() => html(tag, attributes, ...children))
  }
)

testProp(`html returns elements`, [elementArb(4)], (t, element) => {
  t.true(isElement(element))
})
