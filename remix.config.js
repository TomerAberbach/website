/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    // eslint-disable-next-line camelcase
    v2_meta: true,
  },
  appDirectory: `src`,
  assetsBuildDirectory: `public/build`,
  publicPath: `/build`,
  serverBuildPath: `build/index.js`,
  serverDependenciesToBundle: [/^(?!(?:shiki|uglify-js|sharp)$).*/u],
  ignoredRouteFiles: [`**/.*`],
  watchPaths: `private/**/*`,
}
