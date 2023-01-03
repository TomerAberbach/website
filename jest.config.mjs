import config from 'tomer/jest'

export default {
  ...config,
  moduleNameMapper: {
    '^~/(.*)\\.js': `<rootDir>/src/$1`,
    '^(\\.{1,2}/.*)\\.js$': `$1`,
  },
}
