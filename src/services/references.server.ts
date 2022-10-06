import { filter, map, pipe, reduce, toSet } from 'lfi'
import { removePrefix } from './helpers'

export default function parseReferences(hrefs: readonly string[]): Set<string> {
  return pipe(
    hrefs,
    filter(href => !href.startsWith(`#`)),
    map(parseReference),
    reduce(toSet()),
  )
}

function parseReference(href: string): string {
  const url = new URL(href, `https://${HOSTNAME}`)

  if (url.hostname === HOSTNAME) {
    return removePrefix(url.pathname, `/`)
  }

  return removePrefix(url.hostname, `www.`)
}

const HOSTNAME = `tomeraberba.ch`
