import { fc } from 'ava-fast-check'
import { createElement } from 'html/create-element'
import { nonSelfClosingTagArb, selfClosingTagArb } from './tags/arbitraries'
import { attributesArb } from './attributes/arbitraries'
import { childrenArb } from './children/arbitraries'

export const selfClosingElementArb = () =>
  selfClosingTagArb().chain(tag =>
    attributesArb(tag).map(attributes => createElement(tag, attributes))
  )

export const nonSelfClosingElementArb = fc.memo(n =>
  nonSelfClosingTagArb().chain(tag =>
    fc
      .tuple(attributesArb(tag), childrenArb(n))
      .map(([attributes, children]) => createElement(tag, attributes, children))
  )
)

export const elementArb = fc.memo(n =>
  fc.oneof(selfClosingElementArb(), nonSelfClosingElementArb(n))
)

export const componentArb = fc.memo(n => fc.func(elementArb(n)))
