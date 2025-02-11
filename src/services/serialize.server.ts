import { data } from 'react-router'
import superjson from 'superjson'

export const serialize = <Value>(
  value: Value,
  init?: number | ResponseInit,
): ReturnType<typeof data<Value>> =>
  data<Value>(superjson.serialize(value) as Value, init)
