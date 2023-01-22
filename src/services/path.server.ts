import { join } from 'path'

const createPath =
  (dirname: string) =>
  (...paths: readonly string[]) =>
    join(process.cwd(), dirname, ...paths)

export const privatePath = createPath(`private`)

export const publicPath = createPath(`public`)
