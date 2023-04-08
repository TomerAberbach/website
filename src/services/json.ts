import type {
  AppData,
  // eslint-disable-next-line camelcase
  V2_HtmlMetaDescriptor as HtmlMetaDescriptor,
  JsonFunction,
  // eslint-disable-next-line camelcase
  V2_MetaFunction as MetaFunction,
  TypedResponse,
} from '@remix-run/node'
import { json as remixJson } from '@remix-run/node'
import type { Location, Params } from '@remix-run/react'
import {
  isRouteErrorResponse,
  useLoaderData as useRemixLoaderData,
  useRouteError as useRemixRouteError,
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

export const useRouteError = (): unknown => {
  const error = useRemixRouteError()
  if (!isRouteErrorResponse(error)) {
    return error
  }

  return { ...error, data: deserialize(error.data as SuperJSONResult) }
}

export const createMeta =
  <DataOrFunction>(
    meta: (args: {
      data?: InferData<DataOrFunction>
      params: Params
      location: Location
    }) => HtmlMetaDescriptor[],
  ): MetaFunction =>
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
