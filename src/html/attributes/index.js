import { isAttributeName } from './names'
import { isAttributeValue } from './values'

export const isAttribute = value =>
  Array.isArray(value) &&
  value.length === 2 &&
  isAttributeName(value[0]) &&
  isAttributeValue(value[1])
