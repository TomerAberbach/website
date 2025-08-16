import fs from 'node:fs/promises'
import type { Simplify } from 'type-fest'
import { z } from 'zod'
import parseFrontMatter from 'gray-matter'
import { select } from 'hast-util-select'
import type { Root as HtmlRoot } from 'hast'
import { entries } from 'lfi'
import readingTime from 'reading-time'
import { invariant } from '@epic-web/invariant'
import { parseHrefs, parseReferences } from './parse-references.server.ts'
import { renderPost } from './render-post.server.tsx'
import {
  convertMarkdownToHtml,
  convertMarkdownToText,
} from './convert-markdown.server.ts'
import { getPostPath } from './post-keys.server.ts'
import type { PostKey } from './post-keys.server.ts'
import type { Dates } from './format.ts'

export const getPost = (key: PostKey): Promise<Post> => {
  switch (key.type) {
    case `href`:
      return getHrefPost(key)
    case `markdown`:
      return getMarkdownPost(key)
  }
}

export const getHrefPost = async (key: PostKey): Promise<HrefPost> => {
  invariant(
    key.type === `href`,
    `Expected \`${key.id}\` to be an \`href\` post.`,
  )

  const { data } = parseFrontMatter(await readPost(key))
  const { hrefs, ...otherMetadata } = hrefPostMetadataSchema.parse(data)
  const post: HrefPost = {
    id: otherMetadata.href,
    type: `href`,
    ...otherMetadata,
    references: parseReferences(hrefs),
  }
  return post
}

export const getMarkdownPost = async (key: PostKey): Promise<MarkdownPost> => {
  invariant(
    key.type === `markdown`,
    `Expected \`${key.id}\` to be a \`markdown\` post.`,
  )

  const { data, content } = parseFrontMatter(await readPost(key))
  const htmlAst = await convertMarkdownToHtml(content)
  const post: MarkdownPost = {
    id: key.id,
    type: `markdown`,
    ...basePostMetadataSchema.parse(data),
    references: parseReferences(parseHrefs(htmlAst)),
    minutesToRead: Math.max(1, Math.round(readingTime(content).minutes)),
    html: renderPost(htmlAst),
    description: truncate(convertMarkdownToText(content)),
    features: extractMarkdownPostFeatures(htmlAst),
  }
  return post
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

const truncate = (text: string): string => {
  if (text.length <= MAX_LENGTH) {
    return text
  }

  for (let offset = 0; offset < 15; offset++) {
    if (/\s/u.test(text.charAt(MAX_LENGTH - offset))) {
      return `${text.slice(0, Math.max(0, MAX_LENGTH - offset))}…`
    }
  }

  return text.slice(0, Math.max(0, MAX_LENGTH))
}

const MAX_LENGTH = 200

const readPost = (key: PostKey): Promise<string> =>
  fs.readFile(getPostPath(key), `utf8`)

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

export type BasePost = PostKey & {
  title: string
  tags: Set<string>
  dates: Dates
  references: Map<string, Set<string>>
  referencedBy: Map<string, string>
}

const stringSetSchema = z
  .array(z.string())
  .refine(strings => new Set(strings).size === strings.length)
  .transform(strings => new Set(strings.sort()))

const basePostMetadataSchema = z.object({
  title: z.string(),
  tags: stringSetSchema,
  referencedBy: z
    .record(z.string(), z.string())
    .default({})
    .transform(references => new Map(entries(references))),
  dates: z.object({
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
})

const hrefPostMetadataSchema = basePostMetadataSchema.extend({
  href: z.string(),
  hrefs: stringSetSchema,
})
