import { fc } from 'ava-fast-check'
import { elementArb } from '../arbitraries'

export const nonElementChildArb = () =>
  fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.string(),
    fc.integer(),
    fc.float()
  )

export const childArb = fc.memo(n =>
  fc.oneof(elementArb(n), elementArb(n), nonElementChildArb())
)

export const childrenArb = fc.memo(n =>
  fc.array(n <= 1 ? nonElementChildArb() : childArb(n - 1))
)
