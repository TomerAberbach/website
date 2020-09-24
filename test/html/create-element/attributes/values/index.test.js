import { fc, testProp } from 'ava-fast-check'
import { isAttributeValue } from 'html/create-element/attributes/values'

testProp(`isAttributeValue returns a boolean`, [fc.anything()], (t, value) => {
  t.is(typeof isAttributeValue(value), `boolean`)
})
