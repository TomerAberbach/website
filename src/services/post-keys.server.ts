import { basename } from 'node:path'
import fs from 'node:fs/promises'
import {
  asConcur,
  flatMapConcur,
  map,
  mapConcur,
  pipe,
  reduce,
  reduceConcur,
  toArray,
  toGrouped,
  toMap,
} from 'lfi'
import { invariant } from '@epic-web/invariant'
import { privatePath } from './path.server.ts'
import { cache } from './cache.server.ts'

export const getPostPath = (key: PostKey): string =>
  privatePath(`posts`, key.type, `${key.id}.md`)

export const getPostKeys = cache(async (): Promise<Map<string, PostKey>> => {
  const keysById = await pipe(
    asConcur(POST_TYPES),
    flatMapConcur(async type =>
      pipe(
        asConcur(await fs.readdir(privatePath(`posts`, type))),
        mapConcur(async name => {
          const id = parseId(name)
          return [id, { id, type }]
        }),
      ),
    ),
    reduceConcur(toGrouped(toArray(), toMap())),
  )
  return pipe(
    keysById,
    map(([id, keys]) => {
      invariant(keys.length === 1, `Expected post ID to be unique: ${id}`)
      return [id, keys[0]!]
    }),
    reduce(toMap()),
  )
})

const parseId = (name: string): string => {
  invariant(name.endsWith(MD_EXTENSION), `Expected name ending with \`.md\``)
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`

const POST_TYPES = [`href`, `markdown`] as const
export type PostType = (typeof POST_TYPES)[number]
export type PostKey = {
  id: string
  type: PostType
}
