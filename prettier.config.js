import config from 'tomer/prettier'

export default {
  ...config,
  proseWrap: `preserve`,
  plugins: [`prettier-plugin-tailwindcss`],
}
