import { basename, join } from 'path'
import fs from 'fs/promises'
import { asConcur, mapConcur, pipe } from 'lfi'
import type { ConcurIterable } from 'lfi'
import { privatePath } from '../path.server.js'
import assert from '~/services/assert.js'

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
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
