const plugin = require(`tailwindcss/plugin`)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}`],
  theme: {
    extend: {},
  },
  plugins: [
    require(`@tailwindcss/typography`),
    plugin(({ addVariant }) => {
      addVariant(`js`, `.js &`)
    }),
  ],
}
