export const getSiteUrl = (path: string): string =>
  removeTrailingSlash(String(new URL(path, SITE_URL)))

const removeTrailingSlash = (url: string) =>
  url.endsWith(`/`) ? url.slice(0, -1) : url

export const SITE_URL = removeTrailingSlash(
  String(
    new URL(
      `/`,
      typeof window === `undefined`
        ? process.env.SITE_URL ?? `http://localhost:3000`
        : window.location.href,
    ),
  ),
)
