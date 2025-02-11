import fs from 'node:fs/promises'
import { basename } from 'node:path'
import type { Config } from '@react-router/dev/config'
import { map, pipe } from 'lfi'
import { invariant } from '@epic-web/invariant'

export default {
  prerender: async ({ getStaticPaths }) => [
    ...getStaticPaths(),
    ...pipe(
      await fs.readdir(`./private/posts/markdown`),
      map(name => `/${parseId(name)}`),
    ),
  ],
} satisfies Config

const parseId = (name: string): string => {
  invariant(name.endsWith(MD_EXTENSION), `Expected name ending with '.md'`)
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
