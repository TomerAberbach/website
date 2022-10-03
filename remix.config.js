/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: `src`,
  assetsBuildDirectory: `public/build`,
  publicPath: `/build`,
  serverBuildPath: `build/index.js`,
  // eslint-disable-next-line prefer-named-capture-group
  serverDependenciesToBundle: [/^(?!(shiki|uglify-js)$).*/u],
  ignoredRouteFiles: [`**/.*`],
}
