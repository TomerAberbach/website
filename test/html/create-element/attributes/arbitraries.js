import { fc } from 'ava-fast-check'
import { attributeNameArb } from './names/arbitraries'
import { attributeValueArb } from './values/arbitraries'

export const attributeArb = tag =>
  fc.tuple(attributeNameArb(tag), attributeValueArb())

export const attributesArb = tag =>
  fc.dictionary(attributeNameArb(tag), attributeValueArb())
