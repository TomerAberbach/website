import { isAttributeName } from './names'
import { isAttributeValue } from './values'

export const isAttribute = ({ value, tag }) =>
  Array.isArray(value) &&
  value.length === 2 &&
  isAttributeName({ value: value[0], tag }) &&
  isAttributeValue(value[1])
