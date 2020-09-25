import { fc, testProp } from 'ava-fast-check'
import { isAttribute } from 'html/create-element/attributes'
import { tagArb } from '../tags/arbitraries'

testProp(
  `isAttribute returns a boolean`,
  [fc.anything(), tagArb()],
  (t, value, tag) => {
    t.is(typeof isAttribute({ value, tag }), `boolean`)
  }
)
