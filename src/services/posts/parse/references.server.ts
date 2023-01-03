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
  const url = new URL(href, `https://${HOSTNAME}`)

  if (url.hostname === HOSTNAME) {
    return removePrefix(url.pathname, `/`)
  }

  return removePrefix(url.hostname, `www.`)
}

const HOSTNAME = `tomeraberba.ch`

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
