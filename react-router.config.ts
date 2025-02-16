import type { Config } from '@react-router/dev/config'
import { filter, map, pipe } from 'lfi'
import { getPostKeys } from './src/services/post-keys.server.ts'

export default {
  appDirectory: `src`,
  prerender: async ({ getStaticPaths }) => [
    ...getStaticPaths(),
    ...pipe(
      await getPostKeys(),
      filter(([, key]) => key.type === `markdown`),
      map(([id]) => `/${id}`),
    ),
  ],
} satisfies Config
