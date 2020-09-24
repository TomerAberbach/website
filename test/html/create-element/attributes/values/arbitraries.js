import { fc } from 'ava-fast-check'

export const attributeValueArb = () =>
  fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.string(),
    fc.integer(),
    fc.float(),
    fc.boolean()
  )
