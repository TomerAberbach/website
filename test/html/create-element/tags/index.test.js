import { testProp, fc } from 'ava-fast-check'
import {
  isNonSelfClosingTag,
  isSelfClosingTag,
  isTag
} from 'html/create-element/tags'

testProp(`isTag returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isTag(value), `boolean`)
})

testProp(`isSelfClosingTag returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isSelfClosingTag(value), `boolean`)
})

testProp(
  `isNonSelfClosingTag returns a boolean`,
  [fc.anything()],
  (t, value) => {
    t.is(typeof isNonSelfClosingTag(value), `boolean`)
  }
)
