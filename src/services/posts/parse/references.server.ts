import {
  filter,
  flatMap,
  map,
  pipe,
  reduce,
  toGrouped,
  toMap,
  toSet,
} from 'lfi'
import { selectAll } from 'hast-util-select'
import type { Root } from 'hast'
import { SITE_HOSTNAME, SITE_URL } from '~/services/url.js'

export const parseReferences = (
  hrefs: Iterable<string>,
): Map<string, Set<string>> =>
  pipe(
    hrefs,
    filter(href => !href.startsWith(`#`)),
    map((href): [string, string] => [parseReference(href), href]),
    reduce(toGrouped(toSet(), toMap())),
  )

const parseReference = (href: string): string => {
  const url = new URL(href, SITE_URL)
  let { hostname, pathname } = url

  if (hostname === SITE_HOSTNAME) {
    return removePrefix(pathname, `/`)
  }

  hostname = removePrefix(hostname, `www.`)
  return NORMALIZED_HOSTNAMES.get(hostname) ?? hostname
}

const NORMALIZED_HOSTNAMES: ReadonlyMap<string, string> = new Map([
  [`open.spotify.com`, `spotify.com`],
  [`t.co`, `twitter.com`],
  [`workspaceupdates.googleblog.com`, `googleblog.com`],
])

const removePrefix = (string: string, prefix: string): string =>
  string.startsWith(prefix) ? string.slice(prefix.length) : string

export const parseHrefs = (htmlAst: Root): Set<string> =>
  pipe(
    selectAll(`a`, htmlAst),
    flatMap(element => {
      const href = element.properties?.href
      return typeof href === `string` ? [href] : []
    }),
    reduce(toSet()),
  )
