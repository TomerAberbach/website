/**
 * The path of a built page as it is served, without the `.html` extension
 * that the built file has.
 */
export const getPagePathname = (pathname: string): string =>
  pathname.replace(/\/index\.html$/u, `/`).replace(/\.html$/u, ``)
