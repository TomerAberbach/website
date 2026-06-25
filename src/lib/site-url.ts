const removeTrailingSlash = (url: string): string =>
  url.endsWith(`/`) ? url.slice(0, -1) : url

// `import.meta.env.SITE` is populated from `site` in `astro.config.ts` at build
// time. The fallback keeps `astro dev`/tests working when it is unset (it is
// typed `string` but is actually `undefined` outside the Astro build).
const site = import.meta.env.SITE as string | undefined

export const SITE_URL: string = removeTrailingSlash(
  new URL(`/`, site ?? `http://localhost:4321`).toString(),
)

export const getSiteUrl = (path: string): string =>
  removeTrailingSlash(new URL(path, SITE_URL).toString())
