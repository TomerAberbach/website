const { join } = require(`path`)

module.exports = {
  plugins: [
    require(`postcss-import`),
    require(`postcss-url`)({
      url: `copy`,
      basePath: join(__dirname, `private`),
      assetsPath: join(__dirname, `public/fonts`),
      useHash: true,
      hashOptions: { append: true },
    }),
    require(`postcss-url`)({
      url: ({ url }) => url.slice(Math.max(0, url.indexOf(`/fonts`))),
    }),
    require(`tailwindcss`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
