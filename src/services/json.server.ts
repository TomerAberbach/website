import type { JsonFunction } from '@remix-run/node'
import { json as remixJson } from '@remix-run/node'
import { serialize } from 'superjson'

export const json: JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit,
) => remixJson<Data>(serialize(data) as Data, init)
