import type { Dates } from '~/services/format.ts'

export type Post = MarkdownPost | HrefPost

export type MarkdownPost = BasePost & {
  type: `markdown`
  minutesToRead: number
  content: string
  description: string
  previousPost?: AdjacentMarkdownPost
  nextPost?: AdjacentMarkdownPost
}

export type AdjacentMarkdownPost = { id: string; title: string }

export type HrefPost = BasePost & { type: `href`; href: string }

type BasePost = {
  id: string
  title: string
  tags: Set<string>
  dates: Dates
  references: Map<string, Set<string>>
  referencedBy: Map<string, string>
}
