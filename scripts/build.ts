import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { $ } from 'zx'

$.preferLocal = true
$.verbose = true

const rootPath = dirname(dirname(fileURLToPath(import.meta.url)))
const fromRoot = (path: string): string => join(rootPath, path)

// Clean
const buildPaths = [`src/styles/build`, `build`, `public/build`].map(fromRoot)
await $`tomer clean ${buildPaths}`

// Generate font subsets
const fontsBuildPath = fromRoot(`private/fonts/build`)
await $`mkdir -p ${fontsBuildPath}`
await $`remix build`
const runServerCommand = `remix-serve ${fromRoot(`build/index.js`)}`
const glyphhangerCommand = `glyphhanger http://localhost:3000 --spider-limit=0 --formats=woff,woff2 --subset=${fromRoot(`private/fonts/*.ttf`)} --output=${fontsBuildPath}`
await $`start-server-and-test ${runServerCommand} http-get://localhost:3000 ${glyphhangerCommand}`

// Rebuild with new fonts and minify
await $`remix build`
await $`find public/build -name \\*.js -exec terser --module -c keep_fargs=false -o {} -- {} \\;`
