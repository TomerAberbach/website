import type { Properties } from 'hast'

/**
 * Flatten a list of (possibly space-separated) class strings into the array of
 * tokens `hast` expects for `className`, dropping falsy values.
 */
export const cx = (
  ...parts: readonly (string | false | null | undefined)[]
): string[] =>
  parts
    .filter((part): part is string => Boolean(part))
    .flatMap(part => part.split(/\s+/u))
    .filter(Boolean)

/** Normalize an existing `hast` `className` value into a token array. */
export const classList = (className: Properties[string]): string[] => {
  if (Array.isArray(className)) {
    return className.map(String)
  }
  if (typeof className === `string`) {
    return className.split(/\s+/u).filter(Boolean)
  }
  return []
}
