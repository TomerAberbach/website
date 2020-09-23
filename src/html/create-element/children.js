import { isElement } from './index'

const childTypes = new Set([`string`, `number`])

const isSingletonChild = value =>
  value == null || childTypes.has(typeof value) || isElement(value)

export const isChild = value =>
  (Array.isArray(value) && value.every(isSingletonChild)) ||
  isSingletonChild(value)
