import type { Config } from '@react-router/dev/config'
import { filter, flatMap, pipe } from 'lfi'
import { getPostKeys } from './src/services/post-keys.server.ts'

export default {
  appDirectory: `src`,
  // Don't prerender the home page because it renders differently based on query
  // parameters.
  prerender: {
    paths: async () => [
      `/feed.json`,
      `/rss.xml`,
      ...pipe(
        await getPostKeys(),
        filter(([, key]) => key.type === `markdown`),
        flatMap(([id]) => [`/${id}`, `/${id}.png`]),
      ),
    ],
    // The first request renders every post, which takes longer than the
    // default of ten seconds on a slow build machine. The option is read but
    // missing from the config type.
    timeout: 5 * 60 * 1000,
  } as Config[`prerender`],
} satisfies Config
