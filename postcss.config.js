import { existsSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/postcss'
import cssnano from 'cssnano'
import postcssFontpie from 'postcss-fontpie'
import postcssUrl from 'postcss-url'

let fontsPath = join(import.meta.dirname, `private/fonts`)
const fontsBuildPath = join(fontsPath, `build`)
if (process.env.NODE_ENV === `production` && existsSync(fontsBuildPath)) {
  fontsPath = fontsBuildPath
}

export default {
  plugins: [
    postcssUrl({
      filter: `**/*.{woff,woff2}`,
      url: `copy`,
      basePath: fontsPath,
      assetsPath: `build`,
      useHash: true,
      hashOptions: { append: true },
    }),
    postcssFontpie({
      fontTypes: { dm: `mono`, 'Kantumruy Pro': `sans-serif` },
      resolveFilename: ({ family, weight, style }) => {
        const filename = `${family.replace(` `, `-`).toLowerCase()}-${weight}${style === `italic` ? `-italic` : ``}-subset.woff2`
        return join(fontsPath, filename)
      },
    }),
    tailwindcss,
    ...(process.env.NODE_ENV === `production` ? [cssnano] : []),
  ],
}
