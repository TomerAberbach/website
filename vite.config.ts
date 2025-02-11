import { reactRouter } from '@react-router/dev/vite'
import { createLogger, defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import imagemin from '@vheemstra/vite-plugin-imagemin'
import imageminJpeg from 'imagemin-mozjpeg'
import imageminGif from 'imagemin-gifsicle'
import imageminWebp from 'imagemin-webp'
import imageminPng from 'imagemin-pngquant'
import imageminSvg from 'imagemin-svgo'
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
