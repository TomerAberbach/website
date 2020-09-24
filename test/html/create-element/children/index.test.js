import { fc, testProp } from 'ava-fast-check'
import { isChild } from 'html/create-element/children'

testProp(`isChild returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isChild(value), `boolean`)
})
