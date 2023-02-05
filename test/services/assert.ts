import assert from '~/services/assert.js'

test.each([false, 0, -0, ``, null, undefined, NaN])(
  `assert throws for a falsy condition`,
  falsyValue => {
    expect(() => assert(falsyValue)).toThrow()
    expect(() => assert(falsyValue, `oh no!`)).toThrow(`oh no!`)
    expect(() => assert(falsyValue, () => `oh no!`)).toThrow(`oh no!`)
  },
)

test.each([true, 1, -1, `hello`, {}])(
  `assert doesn't throw for a truthy condition`,
  truthyValue => {
    expect(() => assert(truthyValue)).not.toThrow()
    expect(() => assert(truthyValue, `oh no!`)).not.toThrow()
    expect(() => assert(truthyValue, () => `oh no!`)).not.toThrow()
  },
)
