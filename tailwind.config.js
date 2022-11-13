const defaultTheme = require(`tailwindcss/defaultTheme`)
const colors = require(`tailwindcss/colors`)
const plugin = require(`tailwindcss/plugin`)
const roundTo = require(`round-to`)

const createFluidModularScale =
  ({ value, ratio, viewport }) =>
  step => {
    const min = value.min * ratio.min ** step
    const max = value.max * ratio.max ** step
    const slope = (max - min) / (viewport.max - viewport.min)
    const base = max - slope * viewport.max

    const calc = `calc(${vw(100 * slope)} + ${rem(base)})`
    return `clamp(${rem(min)}, ${calc}, ${rem(max)})`
  }

const rem = number => formatWithUnit(number, `rem`)
const vw = number => formatWithUnit(number, `vw`)
const formatWithUnit = (number, unit) => `${roundTo(number, 5)}${unit}`

const fontSizeScale = createFluidModularScale({
  value: { min: 1, max: 1.25 },
  ratio: { min: 1.15, max: 1.175 },
  viewport: { min: 20, max: 60 },
})

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}`],
  theme: {
    fontFamily: {
      sans: [`Kantumruy Pro`, ...defaultTheme.fontFamily.sans],
      mono: [`dm`, ...defaultTheme.fontFamily.mono],
    },
    fontSize: {
      xs: [fontSizeScale(-2), 1.6],
      sm: [fontSizeScale(-1), 1.6],
      base: [fontSizeScale(0), 1.6],
      lg: [fontSizeScale(1), 1.6],
      xl: [fontSizeScale(2), 1.2],
      '2xl': [fontSizeScale(3), 1.2],
      '3xl': [fontSizeScale(4), 1.2],
      '4xl': [fontSizeScale(5), 1.1],
      '5xl': [fontSizeScale(6), 1.1],
      '6xl': [fontSizeScale(7), 1.1],
      '7xl': [fontSizeScale(8), 1],
      '8xl': [fontSizeScale(9), 1],
      '9xl': [fontSizeScale(10), 1],
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
