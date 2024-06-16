const { join } = require(`path`)
const { existsSync } = require(`fs`)

const fontsPath = join(__dirname, `private/fonts`)
const fontsBuildPath = join(fontsPath, `build`)

module.exports = {
  plugins: [
    require(`postcss-import`),
    require(`postcss-url`)({
      filter: `**/*.{woff,woff2}`,
      url: `copy`,
      basePath: existsSync(fontsBuildPath) ? fontsBuildPath : fontsPath,
      assetsPath: `build`,
      useHash: true,
      hashOptions: { append: true },
    }),
    require(`postcss-fontpie`)({
      fontTypes: { dm: `mono`, 'Kantumruy Pro': `sans-serif` },
      srcUrlToFilename: url => join(__dirname, `src/styles`, url),
    }),
    require(`tailwindcss`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
