import { removePrefix } from '../../src/services/helpers.js'

test(`removePrefix returns the given string when the given prefix isn't present`, () => {
  const string = `abc`

  const processedString = removePrefix(string, `b`)

  expect(processedString).toBe(string)
})

test(`removePrefix returns the given string without given prefix when it's present`, () => {
  const string = `abc`

  const processedString = removePrefix(string, `ab`)

  expect(processedString).toBe(`c`)
})
