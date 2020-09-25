import { testProp, fc } from 'ava-fast-check'
import { isAttributeName } from 'html/create-element/attributes/names'
import { attributeNameArb } from './arbitraries'
import { tagArb } from '../../tags/arbitraries'

testProp(
  `isAttributeName returns a boolean`,
  [fc.anything(), tagArb()],
  (t, value, tag) => {
    t.is(typeof isAttributeName({ value, tag }), `boolean`)
  }
)

testProp(
  `isAttributeName returns true for generic attribute names`,
  [attributeNameArb(), tagArb()],
  (t, value, tag) => {
    t.true(isAttributeName({ value, tag }))
  }
)
