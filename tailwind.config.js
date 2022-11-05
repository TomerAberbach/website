const defaultTheme = require(`tailwindcss/defaultTheme`)
const colors = require(`tailwindcss/colors`)
const plugin = require(`tailwindcss/plugin`)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}`],
  theme: {
    fontFamily: {
      sans: [`Ubuntu`, ...defaultTheme.fontFamily.sans],
      mono: [`dm`, ...defaultTheme.fontFamily.mono],
    },
    colors: {
      transparent: colors.transparent,
      current: colors.current,
      black: colors.black,
      white: colors.white,
      gray: {
        50: `hsl(201, 5%, 96%)`,
        100: `hsl(201, 5%, 89%)`,
        200: `hsl(201, 5%, 80%)`,
        300: `hsl(201, 5%, 70%)`,
        400: `hsl(201, 5%, 60%)`,
        500: `hsl(201, 5%, 49%)`,
        600: `hsl(201, 5%, 39%)`,
        700: `hsl(201, 5%, 30%)`,
        800: `hsl(201, 5%, 23%)`,
        900: `hsl(201, 5%, 16%)`,
      },
      blue: {
        50: `hsl(201, 100%, 95%)`,
        100: `hsl(201, 100%, 90%)`,
        200: `hsl(201, 98%, 85%)`,
        300: `hsl(201, 98%, 76%)`,
        400: `hsl(201, 97%, 67%)`,
        500: `hsl(201, 96%, 60%)`,
        600: `hsl(201, 93%, 48%)`,
        700: `hsl(201, 86%, 40%)`,
        800: `hsl(201, 89%, 30%)`,
        900: `hsl(201, 96%, 23%)`,
      },
      orange: {
        50: `hsl(16, 100%, 95%)`,
        100: `hsl(16, 100%, 90%)`,
        200: `hsl(16, 98%, 85%)`,
        300: `hsl(16, 98%, 76%)`,
        400: `hsl(16, 96%, 67%)`,
        500: `hsl(16, 93%, 60%)`,
        600: `hsl(16, 89%, 52%)`,
        700: `hsl(16, 86%, 40%)`,
        800: `hsl(16, 89%, 30%)`,
        900: `hsl(16, 96%, 23%)`,
      },
      yellow: {
        100: `hsl(49, 100%, 96%)`,
        200: `hsl(48, 100%, 88%)`,
        300: `hsl(48, 98%, 76%)`,
        400: `hsl(48, 96%, 68%)`,
        500: `hsl(44, 94%, 63%)`,
        600: `hsl(43, 92%, 48%)`,
        700: `hsl(40, 87%, 48%)`,
        800: `hsl(36, 77%, 48%)`,
        900: `hsl(29, 80%, 44%)`,
      },
    },
    extend: {},
  },
  plugins: [
    require(`@tailwindcss/typography`),
    plugin(({ addVariant }) => {
      addVariant(`js`, `.js &`)
    }),
  ],
}
