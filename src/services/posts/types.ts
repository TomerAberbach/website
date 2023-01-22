import type { Dates } from '../format.js'

export type Post = MarkdownPost | HrefPost

export type MarkdownPost = BasePost & {
  type: `markdown`
  minutesToRead: number
  content: {
    html: string
    text: string
  }
}

export type HrefPost = BasePost & { type: `href`; href: string }

type BasePost = {
  id: string
  title: string
  tags: Set<string>
  dates: Dates
  references: Map<string, Set<string>>
  referencedBy: Set<string>
}
