import type { LoaderFunction } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'

export const loader: LoaderFunction = ({ params }) =>
  redirect(`/${removeSuffix(params[`*`]!, `.html`)}`, { status: 301 })

const removeSuffix = (string: string, suffix: string) =>
  string.endsWith(suffix) ? string.slice(0, -suffix.length) : string
