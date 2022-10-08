import parseReferences from '../../../src/services/references.server'

test(`parseReferences parses references`, () => {
  const hrefs = [
    `#heading`,
    `weird`,
    `./relative`,
    `./relative#wow`,
    `/absolute`,
    `/absolute`,
    `https://tomeraberba.ch/something`,
    `https://google.com/a`,
    `https://google.com/b`,
    `https://www.google.com/c`,
  ]

  const references = parseReferences(hrefs)

  expect(references).toStrictEqual(
    new Set([`weird`, `relative`, `absolute`, `something`, `google.com`]),
  )
})
