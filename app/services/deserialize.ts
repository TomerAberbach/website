import type {
  Location,
  MetaDescriptor,
  MetaFunction,
  Params,
} from 'react-router'
import {
  isRouteErrorResponse,
  useLoaderData as useRouterLoaderData,
  useRouteError as useRouterRouteError,
} from 'react-router'
import superjson from 'superjson'
import type { SuperJSONResult } from 'superjson'

export const useLoaderData = <
  DataOrFunction,
>(): SerializeFrom<DataOrFunction> =>
  superjson.deserialize(useRouterLoaderData())

export const useRouteError = (): unknown => {
  const error = useRouterRouteError()
  if (!isRouteErrorResponse(error)) {
    return error
  }

  return {
    ...error,
    data: superjson.deserialize(error.data as SuperJSONResult),
  }
}

export const createMeta =
  <DataOrFunction>(
    meta: (args: {
      data?: SerializeFrom<DataOrFunction>
      params: Params
      location: Location<unknown>
    }) => MetaDescriptor[],
  ): MetaFunction =>
  ({ data, params, location }) =>
    meta({
      data: data ? superjson.deserialize(data as SuperJSONResult) : undefined,
      params,
      location,
    })

type SerializeFrom<T> = ReturnType<typeof useRouterLoaderData<T>>
