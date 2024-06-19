import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import { installGlobals } from '@remix-run/node'
import tsconfigPaths from 'vite-tsconfig-paths'

installGlobals()

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    remix({ appDirectory: `src`, ignoredRouteFiles: [`**/.*`] }),
    tsconfigPaths(),
    {
      name: `restart-for-markdown-change`,
      handleHotUpdate: async ({ server, file }) => {
        if (file.endsWith(`.md`)) {
          await server.restart()
        }
        return []
      },
    },
  ],
})
