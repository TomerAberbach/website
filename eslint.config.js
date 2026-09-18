import { fixupPluginRules } from '@eslint/compat'
import config from '@tomer/eslint-config'

// `eslint-plugin-react` still uses context methods ESLint 10 removed.
export default config.map(entry =>
  entry.plugins?.react
    ? {
        ...entry,
        plugins: {
          ...entry.plugins,
          react: fixupPluginRules(entry.plugins.react),
        },
      }
    : entry,
)
