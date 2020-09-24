import { fc, testProp } from 'ava-fast-check'
import { isAttribute } from 'html/create-element/attributes'

testProp(`isAttribute returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isAttribute(value), `boolean`)
})
