import lintStagedConfig from 'tomer/lint-staged'

const { '*': all, ...rest } = lintStagedConfig
const srcGlob = Object.keys(rest)[0]

export default {
  [srcGlob]: () => [`pnpm lint`, `pnpm typecheck`, `pnpm test`],
  '*': all,
}
