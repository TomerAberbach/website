import type { LoaderFunction } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/server-runtime'

export const loader: LoaderFunction = () =>
  redirect(`https://tomeraberbach.github.io/spotify-true-random`, {
    status: 301,
  })
