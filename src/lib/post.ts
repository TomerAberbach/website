import { invariant } from '@epic-web/invariant'
import type { CollectionEntry } from 'astro:content'
import type { Root as HtmlRoot } from 'hast'
import { select } from 'hast-util-select'
import { toHtml } from 'hast-util-to-html'
import readingTime from 'reading-time'
import type { Simplify } from 'type-fest'
import {
  convertMarkdownToHtml,
  convertMarkdownToText,
} from './convert-markdown.ts'
import type { Dates } from './format.ts'
import { truncateAtWordBoundary } from './format.ts'
import { parseHrefs, parseReferences } from './parse-references.ts'

export const getMarkdownPost = async (
  entry: CollectionEntry<`markdownPosts`>,
): Promise<MarkdownPost> => {
  const { id, body, data } = entry
  invariant(body !== undefined, `Expected a markdown body for \`${id}\``)

  const htmlAst = await convertMarkdownToHtml(body)
  return {
    id,
    type: `markdown`,
    title: data.title,
    tags: data.tags,
    dates: data.dates,
    // Clone so cross-post mutations in `ordered.ts` don't touch the content
    // store's entry.
    referencedBy: new Map(data.referencedBy),
    references: parseReferences(parseHrefs(htmlAst)),
    minutesToRead: Math.max(1, Math.round(readingTime(body).minutes)),
    html: toHtml(htmlAst),
    description: truncateAtWordBoundary(convertMarkdownToText(body)),
    features: extractMarkdownPostFeatures(htmlAst),
  }
}

export const getHrefPost = (entry: CollectionEntry<`hrefPosts`>): HrefPost => {
  const { hrefs, ...metadata } = entry.data
  return {
    ...metadata,
    // `href` posts are keyed by their external URL.
    id: metadata.href,
    type: `href`,
    referencedBy: new Map(metadata.referencedBy),
    references: parseReferences(hrefs),
  }
}

const extractMarkdownPostFeatures = (
  htmlAst: HtmlRoot,
): Set<MarkdownPostFeature> => {
  const features = new Set<MarkdownPostFeature>()

  if (select(`[class='katex']`, htmlAst)) {
    features.add(`math`)
  }

  return features
}

export type Post = HrefPost | MarkdownPost

export type HrefPost = Simplify<
  BasePost & {
    type: `href`
    href: string
  }
>

export type MarkdownPostFeature = `math`
export type MarkdownPost = Simplify<
  BasePost & {
    type: `markdown`
    minutesToRead: number
    html: string
    description: string
    features: Set<MarkdownPostFeature>
  }
>

export type BasePost = {
  id: string
  title: string
  tags: Set<string>
  dates: Dates
  references: Map<string, Set<string>>
  referencedBy: Map<string, string>
}
