const { join } = require(`path`)
const { existsSync } = require(`fs`)

let fontsPath = join(__dirname, `private/fonts`)
const fontsBuildPath = join(fontsPath, `build`)
if (process.env.NODE_ENV === `production` && existsSync(fontsBuildPath)) {
  fontsPath = fontsBuildPath
}

module.exports = {
  plugins: [
    require(`postcss-url`)({
      filter: `**/*.{woff,woff2}`,
      url: `copy`,
      basePath: fontsPath,
      assetsPath: `build`,
      useHash: true,
      hashOptions: { append: true },
    }),
    require(`postcss-fontpie`)({
      fontTypes: { dm: `mono`, 'Kantumruy Pro': `sans-serif` },
      resolveFilename: ({ family, weight, style }) => {
        const filename = `${family.replace(` `, `-`).toLowerCase()}-${weight}${style === `italic` ? `-italic` : ``}-subset.woff2`
        return join(fontsPath, filename)
      },
    }),
    require(`@tailwindcss/postcss`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
