import { dirname, join } from 'node:path'
import { $ } from 'zx'

$.preferLocal = true
$.verbose = true

const rootPath = dirname(import.meta.dirname)
const fromRoot = (path: string): string => join(rootPath, path)

// Clean
const buildPaths = [
  `dist`,
  `src/styles/build`,
  `private/fonts/build`,
  `public/build`,
].map(fromRoot)
await $`rm -rf ${buildPaths}`

// Pass 1: build the site so we can crawl it for the glyphs actually used.
await $`astro build`

// Generate font subsets by spidering the built site.
const fontsBuildPath = fromRoot(`private/fonts/build`)
await $`mkdir -p ${fontsBuildPath}`
const port = 4321
const runServerCommand = `sirv ${fromRoot(`dist`)} --port ${port} --quiet`
const glyphhangerCommand = `glyphhanger http://localhost:${port} --spider-limit=0 --formats=woff,woff2 --subset=${fromRoot(`private/fonts/*.ttf`)} --output=${fontsBuildPath}`
await $({
  // `get-stdin` hangs inside `glyphhanger` without this.
  stdio: `inherit`,
})`start-server-and-test ${runServerCommand} http-get://localhost:${port} ${glyphhangerCommand}`

// Pass 2: rebuild now that the subset fonts exist (the production `postcss`
// font gate picks them up).
await $`astro build`

// Minify
await $`imagemin dist/_astro -o dist/_astro`
await $`find dist -name \\*.js -exec terser --module -c keep_fargs=false -o {} -- {} \\;`
