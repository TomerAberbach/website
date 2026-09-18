import { readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import sharp from 'sharp'
import { optimize } from 'svgo'
import { $, glob } from 'zx'

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
const optimizeImage = async (path: string): Promise<void> => {
  const original = await readFile(path)
  let optimized: Uint8Array
  switch (extname(path)) {
    case `.svg`:
      optimized = Buffer.from(
        optimize(original.toString(), { multipass: true }).data,
      )
      break
    case `.png`:
      optimized = await sharp(original)
        .png({ compressionLevel: 9, palette: false })
        .toBuffer()
      break
    default:
      return
  }
  if (optimized.byteLength < original.byteLength) {
    await writeFile(path, optimized)
  }
}
await Promise.all((await glob(fromRoot(`dist/_astro/*`))).map(optimizeImage))
await $`find dist -name \\*.js -exec terser --module -c keep_fargs=false -o {} -- {} ';'`
