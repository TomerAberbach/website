import { vitePlugin as remix } from '@remix-run/dev'
import { createLogger, defineConfig } from 'vite'
import { installGlobals } from '@remix-run/node'
import tsconfigPaths from 'vite-tsconfig-paths'
import imagemin from '@vheemstra/vite-plugin-imagemin'
import imageminJpeg from 'imagemin-mozjpeg'
import imageminGif from 'imagemin-gifsicle'
import imageminWebp from 'imagemin-webp'
import imageminPng from 'imagemin-pngquant'
import imageminSvg from 'imagemin-svgo'
import restart from 'vite-plugin-restart'

installGlobals()

const logger = createLogger()
const originalWarning = logger.warn.bind(logger)
logger.warn = (msg, options) => {
  if (msg.includes(`[vite:css]`)) {
    // TODO: Create fallback fonts for KaTeX fonts.
    return
  }

  if (
    msg.includes(`[plugin:vite:resolve]`) &&
    msg.includes(`externalized for browser compatibility`)
  ) {
    // Importing server code in routes is the standard Remix practice.
    return
  }

  originalWarning(msg, options)
}

export default defineConfig({
  customLogger: logger,
  server: { port: 3000 },
  plugins: [
    remix({ appDirectory: `src`, ignoredRouteFiles: [`**/.*`] }),
    tsconfigPaths(),
    imagemin({
      plugins: {
        gif: imageminGif(),
        jpg: imageminJpeg(),
        png: imageminPng(),
        svg: imageminSvg(),
      },
      makeWebp: {
        plugins: {
          jpg: imageminWebp(),
          png: imageminWebp(),
        },
      },
    }),
    restart({ restart: [`private/posts/*.md`, `**/*.server.tsx?`] }),
  ],
})
