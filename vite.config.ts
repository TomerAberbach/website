import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { createLogger, defineConfig } from 'vite'
import restart from 'vite-plugin-restart'
import tsconfigPaths from 'vite-tsconfig-paths'

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
