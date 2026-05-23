export const formatDateISO = (date: Date): string => date.toISOString()

export const formatDatesUTC = ({ published, updated }: Dates): string =>
  formatDateUTC(updated ?? published)

export const formatDateUTC = (date: Date): string => date.toUTCString()

export const formatDatesForDisplay = ({ published, updated }: Dates): string =>
  updated
    ? `Updated ${formatDateForDisplay(updated)}`
    : `Published ${formatDateForDisplay(published)}`

export const formatDateForDisplay = (date: Date): string =>
  date.toLocaleDateString(`en-US`, {
    year: `numeric`,
    month: `long`,
    day: `numeric`,
    timeZone: `UTC`,
  })

export type Dates = {
  published: Date
  updated?: Date
}

export const formatMinutesToRead = (minutesToRead: number): string =>
  `${minutesToRead} min read`

export const truncateAtWordBoundary = (
  text: string,
  maxLength = 200,
): string => {
  if (text.length <= maxLength) {
    return text
  }

  for (let offset = 0; offset < 15; offset++) {
    if (/\s/u.test(text.charAt(maxLength - offset))) {
      return `${text.slice(0, Math.max(0, maxLength - offset))}…`
    }
  }

  return text.slice(0, Math.max(0, maxLength))
}
