const { join } = require(`path`)

module.exports = {
  plugins: [
    require(`postcss-import`),
    require(`postcss-url`)({
      filter: `**/*.{woff,woff2}`,
      url: `copy`,
      basePath: join(__dirname, `private/fonts/build`),
      assetsPath: `.`,
      useHash: true,
      hashOptions: { append: true },
    }),
    require(`tailwindcss`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
