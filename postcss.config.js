const { join } = require(`path`)

module.exports = {
  plugins: [
    require(`postcss-import`),
    require(`postcss-url`)({
      url: `copy`,
      basePath: join(__dirname, `private`),
      assetsPath: join(__dirname, `public/build/_assets`),
      useHash: true,
    }),
    require(`tailwindcss`),
    require(`autoprefixer`),
    ...(process.env.NODE_ENV === `production` ? [require(`cssnano`)] : []),
  ],
}
