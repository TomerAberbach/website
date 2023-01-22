/* eslint-disable camelcase */

import type {
  AppData,
  JsonFunction,
  TypedResponse,
  V2_HtmlMetaDescriptor,
  V2_MetaFunction,
} from '@remix-run/node'
import { json as remixJson } from '@remix-run/node'
import type { Location, Params, ThrownResponse } from '@remix-run/react'
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
>(): InferData<DataOrFunction> =>
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

export const createMeta =
  <DataOrFunction>(
    meta: (args: {
      data?: InferData<DataOrFunction>
      params: Params
      location: Location
    }) => V2_HtmlMetaDescriptor[],
  ): V2_MetaFunction =>
  ({ data, params, location }) =>
    meta({
      data: data ? deserialize(data as SuperJSONResult) : undefined,
      params,
      location,
    })

type InferData<DataOrFunction> = DataOrFunction extends (
  // eslint-disable-next-line typescript/no-explicit-any
  ...args: any[]
) => infer Output
  ? Awaited<Output> extends TypedResponse<infer ResponseData>
    ? ResponseData
    : Awaited<Output>
  : Awaited<DataOrFunction>
