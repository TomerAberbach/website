import test from 'ava'
import { testProp, fc } from 'ava-fast-check'
import dedent from 'dedent'
import indentString from 'indent-string'
import { classes, css } from 'css'

test(`css returns a generated class`, t => {
  const className = css`
    background-color: rebeccapurple;
    color: white;
    border-radius: 4px;
  `

  t.is(className, `i1w04ts`)
})

testProp(
  `css returns the same class for the same string`,
  [fc.string()],
  (t, string) => {
    // eslint-disable-next-line no-self-compare
    t.true(css(string) === css(string))
  }
)

testProp(`css stores the provided code`, [fc.string()], (t, string) => {
  t.true(
    classes.has(`.${css(string)} {\n${indentString(dedent(string), 2)}\n}`)
  )
})
