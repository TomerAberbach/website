import type { AppData, JsonFunction, TypedResponse } from '@remix-run/node'
import { json as remixJson } from '@remix-run/node'
import type { ThrownResponse } from '@remix-run/react'
import {
  useCatch as useRemixCatch,
  useLoaderData as useRemixLoaderData,
} from '@remix-run/react'
import { deserialize, serialize } from 'superjson'
import type { SuperJSONResult } from 'superjson/dist/types'

export const json: JsonFunction = <Data>(
  data: Data,
  init?: number | ResponseInit,
) => remixJson<Data>(serialize(data) as Data, init)

export const useLoaderData = <
  DataOrFunction = AppData,
  // eslint-disable-next-line typescript/no-explicit-any
>(): DataOrFunction extends (...args: any[]) => infer Output
  ? Awaited<Output> extends TypedResponse<infer ResponseData>
    ? ResponseData
    : Awaited<Output>
  : Awaited<DataOrFunction> =>
  deserialize(useRemixLoaderData() as SuperJSONResult)

export const useCatch = <
  Result extends ThrownResponse = ThrownResponse,
>(): Result => {
  const caught = useRemixCatch<Result>()

  if (!(`data` in caught)) {
    return caught
  }

  return {
    ...caught,
    data: deserialize<Result[`data`]>(caught.data as SuperJSONResult),
  }
}
