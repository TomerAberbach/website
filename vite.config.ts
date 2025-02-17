import { reactRouter } from '@react-router/dev/vite'
import { createLogger, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import restart from 'vite-plugin-restart'
import tailwindcss from '@tailwindcss/vite'

const logger = createLogger()
const originalWarning = logger.warn.bind(logger)
logger.warn = (msg, options) => {
  if (msg.includes(`[vite:css]`)) {
    // TODO: Create fallback fonts for KaTeX fonts.
    return
  }

  originalWarning(msg, options)
}

export default defineConfig({
  customLogger: logger,
  server: { port: 3000 },
  plugins: [
    tsconfigPaths(),
    reactRouter(),
    tailwindcss(),
    restart({ restart: [`private/posts/**/*.md`, `**/*.server.tsx?`] }),
  ],
})
