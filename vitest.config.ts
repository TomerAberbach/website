import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const srcPath = fileURLToPath(new URL(`src`, import.meta.url))
const privatePath = fileURLToPath(new URL(`private`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: `~/private`, replacement: privatePath },
      { find: `~`, replacement: srcPath },
    ],
  },
  test: {
    environment: `jsdom`,
    coverage: {
      include: [`src`],
    },
  },
})
