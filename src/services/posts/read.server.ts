import { basename, join } from 'node:path'
import fs from 'node:fs/promises'
import { asConcur, flatMapConcur, mapConcur, pipe } from 'lfi'
import type { ConcurIterable } from 'lfi'
import { invariant } from '@epic-web/invariant'
import type { Post } from './types.ts'
import { privatePath } from '~/services/path.server.ts'

export const readRawPosts = async (): Promise<ConcurIterable<RawPost>> => {
  const postsDirectory = privatePath(`posts`)
  return pipe(
    asConcur(POST_TYPES),
    flatMapConcur(async postType => {
      const postTypeDirectory = join(postsDirectory, postType)
      return pipe(
        asConcur(await fs.readdir(postTypeDirectory)),
        mapConcur(async name => ({
          id: parseId(name),
          type: postType,
          content: await fs.readFile(join(postTypeDirectory, name), `utf8`),
        })),
      )
    }),
  )
}

const POST_TYPES: readonly Post[`type`][] = [`href`, `markdown`]

export type RawPost = { id: string; type: Post[`type`]; content: string }

const parseId = (name: string): string => {
  invariant(name.endsWith(MD_EXTENSION), `Expected name ending with '.md'`)
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
