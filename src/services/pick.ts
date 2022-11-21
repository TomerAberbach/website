import { map, pipe, reduce, toObject } from 'lfi'

const pick = <Value extends Record<string, unknown>, Key extends keyof Value>(
  value: Value,
  keys: readonly Key[],
): Pick<Value, Key> =>
  pipe(
    keys,
    map(key => [key, value[key]] as const),
    reduce(toObject()),
  ) as Pick<Value, Key>

export default pick
