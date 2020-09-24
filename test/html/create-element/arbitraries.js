import { fc } from 'ava-fast-check'
import { createElement } from 'html/create-element'
import { nonSelfClosingTagArb, selfClosingTagArb } from './tags/arbitraries'
import { attributesArb } from './attributes/arbitraries'
import { childrenArb } from './children/arbitraries'

export const selfClosingElementArb = () =>
  fc
    .tuple(selfClosingTagArb(), attributesArb())
    .map(([tag, attributes]) => createElement(tag, attributes))

export const nonSelfClosingElementArb = fc.memo(n =>
  fc
    .tuple(nonSelfClosingTagArb(), attributesArb(), childrenArb(n))
    .map(([tag, attributes, children]) =>
      createElement(tag, attributes, ...children)
    )
)

export const elementArb = fc.memo(n =>
  fc.oneof(selfClosingElementArb(), nonSelfClosingElementArb(n))
)

export const componentArb = fc.memo(n => fc.func(elementArb(n)))
