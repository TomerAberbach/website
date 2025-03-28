import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'

$.preferLocal = true
$.verbose = true

const rootPath = dirname(dirname(fileURLToPath(import.meta.url)))
const fromRoot = (path: string): string => join(rootPath, path)

// Clean
const buildPaths = [
  `src/styles/build`,
  `build`,
  `private/fonts/build`,
  `public/build`,
].map(fromRoot)
await $`rm -rf ${buildPaths}`

// Generate font subsets
await $`react-router build`
const fontsBuildPath = fromRoot(`private/fonts/build`)
await $`mkdir -p ${fontsBuildPath}`
const runServerCommand = `react-router-serve ${fromRoot(`build/server/index.js`)}`
const glyphhangerCommand = `glyphhanger http://localhost:3000 --spider-limit=0 --formats=woff,woff2 --subset=${fromRoot(`private/fonts/*.ttf`)} --output=${fontsBuildPath}`
await $({
  // `get-stdin` hangs inside `glyphhanger` without this.
  stdio: `inherit`,
})`start-server-and-test ${runServerCommand} http-get://localhost:3000 ${glyphhangerCommand}`

// Rebuild with new fonts and minify
await $`react-router build`
await $`imagemin build/client/assets -o build/client/assets`
await $`find build/client -name \\*.js -exec terser --module -c keep_fargs=false -o {} -- {} \\;`
