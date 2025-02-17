import type { Config } from '@react-router/dev/config'
import { filter, flatMap, pipe } from 'lfi'
import { getPostKeys } from './src/services/post-keys.server.ts'

export default {
  appDirectory: `src`,
  prerender: async ({ getStaticPaths }) => [
    ...getStaticPaths(),
    ...pipe(
      await getPostKeys(),
      filter(([, key]) => key.type === `markdown`),
      flatMap(([id]) => [
        `/${id}`,
        // TODO: Add back once fonts are fixed.
        // `/${id}.png`
      ]),
    ),
  ],
} satisfies Config
