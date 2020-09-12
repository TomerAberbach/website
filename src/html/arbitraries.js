import { fc } from 'ava-fast-check'
import { createElement } from './index'
import { getNonSelfClosingTags, getSelfClosingTags, getTags } from './tags'

const constantArb = arb => () => arb

export const tagArb = constantArb(fc.constantFrom(...getTags()))

export const selfClosingTagArb = constantArb(
  fc.constantFrom(...getSelfClosingTags())
)

export const nonSelfClosingTagArb = constantArb(
  fc.constantFrom(...getNonSelfClosingTags())
)

export const attributeNameArb = fc.string

export const attributeValueArb = () =>
  fc.oneof(fc.string(), fc.integer(), fc.float(), fc.boolean())

export const attributeArb = () =>
  fc.tuple(attributeNameArb(), attributeValueArb())

export const attributesArb = () =>
  fc.dictionary(attributeNameArb(), attributeValueArb())

export const nonElementChildArb = () =>
  fc.oneof(fc.string(), fc.integer(), fc.float())

export const selfClosingElementArb = () =>
  fc
    .tuple(selfClosingTagArb(), attributesArb())
    .map(([tag, attributes]) => createElement(tag, attributes))

export const nonSelfClosingElementArb = fc.memo(n =>
  fc
    .tuple(
      nonSelfClosingTagArb(),
      attributesArb(),
      // eslint-disable-next-line no-use-before-define
      childrenArb(n)
    )
    .map(([tag, attributes, children]) =>
      createElement(tag, attributes, ...children)
    )
)

export const elementArb = fc.memo(n =>
  fc.oneof(selfClosingElementArb(), nonSelfClosingElementArb(n))
)

export const childArb = fc.memo(n =>
  fc.oneof(elementArb(n), elementArb(n), nonElementChildArb())
)

export const childrenArb = fc.memo(n =>
  fc.array(n <= 1 ? nonElementChildArb() : childArb(n - 1))
)

export const componentArb = fc.memo(n => fc.func(elementArb(n)))
