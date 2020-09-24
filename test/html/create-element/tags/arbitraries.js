import { fc } from 'ava-fast-check'
import {
  nonSelfClosingTags,
  tags,
  selfClosingTags
} from 'html/create-element/tags'

export const tagArb = () => fc.constantFrom(...tags)

export const selfClosingTagArb = () => fc.constantFrom(...selfClosingTags)

export const nonSelfClosingTagArb = () => fc.constantFrom(...nonSelfClosingTags)
