import { fc } from 'ava-fast-check'
import { attributeNameArb } from './names/arbitraries'
import { attributeValueArb } from './values/arbitraries'

export const attributeArb = () =>
  fc.tuple(attributeNameArb(), attributeValueArb())

export const attributesArb = () =>
  fc.dictionary(attributeNameArb(), attributeValueArb())
