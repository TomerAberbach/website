import config from 'tomer/jest'

export default {
  ...config,
  moduleNameMapper: {
    '^~/(.*)\\.tsx?': `<rootDir>/src/$1`,
    '^(\\.{1,2}/.*)\\.js$': `$1`,
  },
}
