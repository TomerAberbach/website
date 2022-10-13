import type { AppData, JsonFunction } from '@remix-run/node'
import { json as remixJson } from '@remix-run/node'
import { useLoaderData as useRemixLoaderData } from '@remix-run/react'
import { deserialize, serialize } from 'superjson'
import type { SuperJSONResult } from 'superjson/dist/types'

export const json: JsonFunction = (data, init) =>
  remixJson(serialize(data), init)

export const useLoaderData = <Data = AppData>(): Data =>
  deserialize(useRemixLoaderData() as SuperJSONResult)
