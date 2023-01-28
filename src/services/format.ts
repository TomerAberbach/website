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
  })

export type Dates = {
  published: Date
  updated?: Date
}

export const formatMinutesToRead = (minutesToRead: number): string =>
  `${minutesToRead} min read`
