import { dirname, join } from 'node:path'
import { $ } from 'zx'

$.preferLocal = true
$.verbose = true

const rootPath = dirname(import.meta.dirname)
const fromRoot = (path: string): string => join(rootPath, path)

// Clean
const buildPaths = [`src/styles/build`, `dist`, `private/fonts/build`].map(
  fromRoot,
)
await $`rm -rf ${buildPaths}`

// Generate font subsets
await $`astro build`
const fontsBuildPath = fromRoot(`private/fonts/build`)
await $`mkdir -p ${fontsBuildPath}`
const runServerCommand = `astro preview --port 3000`
const glyphhangerCommand = `glyphhanger http://localhost:3000 --spider-limit=0 --formats=woff,woff2 --subset=${fromRoot(`private/fonts/*.ttf`)} --output=${fontsBuildPath}`
await $({
  // `get-stdin` hangs inside `glyphhanger` without this.
  stdio: `inherit`,
})`start-server-and-test ${runServerCommand} http-get://localhost:3000 ${glyphhangerCommand}`

// Rebuild with new fonts and minify
await $`astro build`
await $`imagemin dist/_astro -o dist/_astro`
await $`find dist -name \\*.js -exec terser --module -c keep_fargs=false -o {} -- {} ';'`
