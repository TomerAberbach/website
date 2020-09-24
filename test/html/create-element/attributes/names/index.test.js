import { testProp, fc } from 'ava-fast-check'
import { isAttributeName } from 'html/create-element/attributes/names'
import { attributeNameArb } from './arbitraries'

testProp(`isAttributeName returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isAttributeName(value), `boolean`)
})

testProp(
  `isAttributeName returns true for strings`,
  [attributeNameArb()],
  (t, value) => {
    t.true(isAttributeName(value))
  }
)
