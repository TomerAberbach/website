import fnv1a from '@sindresorhus/fnv1a'
import dedent from 'dedent'
import indentString from 'indent-string'

export const classes = new Set()

export const css = (strings, ...values) => {
  if (typeof strings === `string`) {
    strings = [strings]
  }

  let string = ``

  for (let i = 0; i < values.length; i++) {
    string += `${strings[i]}${values[i]}`
  }

  string += strings[strings.length - 1]

  const identifier = `i${fnv1a(string).toString(36)}`
  const rule = `.${identifier} {\n${indentString(dedent(string), 2)}\n}`
  classes.add(rule)

  return identifier
}
