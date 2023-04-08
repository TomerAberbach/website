/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    /* eslint-disable camelcase */
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
    /* eslint-enable camelcase */
  },
  appDirectory: `src`,
  assetsBuildDirectory: `public/build`,
  publicPath: `/build`,
  serverBuildPath: `build/index.js`,
  serverDependenciesToBundle: [/^(?!(?:shiki|uglify-js|sharp)$).*/u],
  ignoredRouteFiles: [`**/.*`],
  watchPaths: `private/**/*`,
}
