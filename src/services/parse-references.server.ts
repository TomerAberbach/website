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
import { SITE_URL } from './site-url.ts'
import fontsStylesPath from '~/styles/fonts.css?url'

export const parseReferences = (
  hrefs: Iterable<string>,
): Map<string, Set<string>> =>
  pipe(
    hrefs,
    filter(href => !href.startsWith(`#`) && !IGNORED_HREFS.has(href)),
    map(href => [parseReference(href), href]),
    reduce(toGrouped(toSet(), toMap())),
  )

const IGNORED_HREFS: ReadonlySet<string> = new Set([fontsStylesPath])

const parseReference = (href: string): string => {
  const url = new URL(href, SITE_URL)
  let { host, pathname } = url

  if (host === SITE_HOST) {
    return removePrefix(pathname, `/`)
  }

  host = removePrefix(host, `www.`)
  return NORMALIZED_HOSTS.get(host) ?? host
}

const SITE_HOST: string = new URL(SITE_URL).host

const NORMALIZED_HOSTS: ReadonlyMap<string, string> = new Map([
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
      const { href } = element.properties
      return typeof href === `string` ? [href] : []
    }),
    reduce(toSet()),
  )
