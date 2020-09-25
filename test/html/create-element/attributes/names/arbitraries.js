import { fc } from 'ava-fast-check'
import {
  attributeNamesByTag,
  genericAttributeNames
} from 'html/create-element/attributes/names'

export const attributeNameArb = tag =>
  fc.constantFrom(
    ...genericAttributeNames,
    ...(attributeNamesByTag.get(tag) ?? [])
  )
