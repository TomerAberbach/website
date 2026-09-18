import { expect, test } from 'vitest'
import {
  formatDateForDisplay,
  formatDatesForDisplay,
  formatDatesUTC,
  formatMinutesToRead,
  truncateAtWordBoundary,
} from './format.ts'

const published = new Date(`2024-01-05T00:00:00Z`)
const updated = new Date(`2024-03-17T00:00:00Z`)

test.each([
  [new Date(`2024-01-05T00:00:00Z`), `January 5, 2024`],
  [new Date(`2023-12-31T23:59:59Z`), `December 31, 2023`],
])(
  `formatDateForDisplay formats %o in UTC with the full month name`,
  (date, formatted) => {
    expect(formatDateForDisplay(date)).toBe(formatted)
  },
)

test(`formatDatesForDisplay shows the published date when there is no updated date`, () => {
  const formatted = formatDatesForDisplay({ published })

  expect(formatted).toBe(`Published January 5, 2024`)
})

test(`formatDatesForDisplay shows the updated date when there is one`, () => {
  const formatted = formatDatesForDisplay({ published, updated })

  expect(formatted).toBe(`Updated March 17, 2024`)
})

test(`formatDatesUTC uses the published date when there is no updated date`, () => {
  const formatted = formatDatesUTC({ published })

  expect(formatted).toBe(`Fri, 05 Jan 2024 00:00:00 GMT`)
})

test(`formatDatesUTC uses the updated date when there is one`, () => {
  const formatted = formatDatesUTC({ published, updated })

  expect(formatted).toBe(`Sun, 17 Mar 2024 00:00:00 GMT`)
})

test(`formatMinutesToRead appends the unit`, () => {
  expect(formatMinutesToRead(3)).toBe(`3 min read`)
})

test.each([
  [`short`, 10, `short`],
  [`0123456789`, 10, `0123456789`],
])(
  `truncateAtWordBoundary leaves %j unchanged at a maximum length of %i`,
  (text, maxLength, truncated) => {
    expect(truncateAtWordBoundary(text, maxLength)).toBe(truncated)
  },
)

test.each([
  [`one two three four`, 10, `one two…`],
  [`one two three four`, 7, `one two…`],
])(
  `truncateAtWordBoundary cuts %j to %i characters at whitespace with an ellipsis`,
  (text, maxLength, truncated) => {
    expect(truncateAtWordBoundary(text, maxLength)).toBe(truncated)
  },
)

test(`truncateAtWordBoundary cuts hard without an ellipsis when no whitespace is within 15 characters`, () => {
  const text = `a`.repeat(30)

  const truncated = truncateAtWordBoundary(text, 20)

  expect(truncated).toBe(`a`.repeat(20))
})

test.each([
  [16, `ab…`],
  [17, `ab ${`c`.repeat(14)}`],
])(
  `truncateAtWordBoundary at a maximum length of %i only finds whitespace within 15 characters`,
  (maxLength, truncated) => {
    const text = `ab ${`c`.repeat(30)}`

    expect(truncateAtWordBoundary(text, maxLength)).toBe(truncated)
  },
)

test(`truncateAtWordBoundary defaults to a maximum length of 200`, () => {
  const text = `${`word `.repeat(39)}word tail`

  const truncated = truncateAtWordBoundary(text)

  expect(truncated).toBe(`${`word `.repeat(39)}word…`)
})
