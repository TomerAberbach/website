import { basename, join } from 'node:path'
import fs from 'node:fs/promises'
import { asConcur, mapConcur, pipe } from 'lfi'
import type { ConcurIterable } from 'lfi'
import { invariant } from '@epic-web/invariant'
import { privatePath } from '~/services/path.server.ts'

export const readRawPosts = async (): Promise<ConcurIterable<RawPost>> => {
  const postsDirectory = privatePath(`posts`)

  return pipe(
    asConcur(await fs.readdir(postsDirectory)),
    mapConcur(async name => ({
      id: parseId(name),
      content: await fs.readFile(join(postsDirectory, name), `utf8`),
    })),
  )
}

export type RawPost = { id: string; content: string }

const parseId = (name: string): string => {
  invariant(name.endsWith(MD_EXTENSION), `Expected name ending with '.md'`)
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
