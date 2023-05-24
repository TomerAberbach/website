module.exports = {
  ...require(`tomer/prettier`),
  proseWrap: `preserve`,
  plugins: [require(`prettier-plugin-tailwindcss`)],
}
