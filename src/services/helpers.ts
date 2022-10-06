export const removePrefix = (string: string, prefix: string): string =>
  string.startsWith(prefix) ? string.substring(prefix.length) : string
