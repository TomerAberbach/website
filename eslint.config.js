import config from '@tomer/eslint-config'

export default [
  ...config,
  // Tests use Vitest browser mode, whose `page` replaces Testing Library's
  // `screen`, and `render*` helpers that return HTML. Report Testing Library
  // rules only for Testing Library's own imports.
  {
    settings: {
      'testing-library/utils-module': `off`,
      'testing-library/custom-renders': `off`,
      'testing-library/custom-queries': `off`,
    },
  },
  {
    files: [`**/*.test.{ts,tsx}`],
    rules: {
      'vitest/expect-expect': [
        `error`,
        { assertFunctionNames: [`expect*`, `assert`, `assertType`] },
      ],
    },
  },
  // Code samples in posts call functions with fixed example arguments.
  {
    files: [`**/*.md/**`],
    rules: { 'unicorn/no-unnecessary-parameters': `off` },
  },
]
