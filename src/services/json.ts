import type {
  MetaDescriptor,
  MetaFunction,
  TypedResponse,
} from '@remix-run/node'
import {
  isRouteErrorResponse,
  useLoaderData as useRemixLoaderData,
  useRouteError as useRemixRouteError,
} from '@remix-run/react'
import type { Location, Params } from '@remix-run/react'
import { deserialize } from 'superjson'
import type { SuperJSONResult } from 'superjson'

export const useLoaderData = <DataOrFunction>(): InferData<DataOrFunction> =>
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
      location: Location<unknown>
    }) => MetaDescriptor[],
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
