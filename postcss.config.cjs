const { join } = require(`path`)

module.exports = {
  plugins: [
    require(`postcss-import`),
    require(`postcss-url`)({
      filter: `**/*.{woff,woff2}`,
      url: `copy`,
      basePath: join(__dirname, `private/fonts/build`),
      assetsPath: `build`,
      useHash: true,
      hashOptions: { append: true },
    }),
    require(`postcss-fontpie`)({
      fontTypes: {
        dm: `mono`,
        'Kantumruy Pro': `sans-serif`,
      },
      srcUrlToFilename: url => join(__dirname, `src/styles`, url),
    }),
    require(`tailwindcss`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
