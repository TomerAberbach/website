export const formatDates = ({ published, updated }: Dates): string =>
  updated
    ? `Updated ${formatDate(updated)}`
    : `Published ${formatDate(published)}`

export const formatDate = (date: Date): string =>
  date.toLocaleDateString(undefined, {
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
