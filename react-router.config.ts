import type { Config } from '@react-router/dev/config'
import { filter, flatMap, pipe } from 'lfi'
import { getPostKeys } from './src/services/post-keys.server.ts'

export default {
  appDirectory: `src`,
  // Don't prerender the home page because it renders differently based on query
  // parameters.
  prerender: async () => [
    `/feed.json`,
    `/rss.xml`,
    ...pipe(
      await getPostKeys(),
      filter(([, key]) => key.type === `markdown`),
      flatMap(([id]) => [`/${id}`, `/${id}.png`]),
    ),
  ],
} satisfies Config
