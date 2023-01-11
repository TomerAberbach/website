export type Post = MarkdownPost | HrefPost

export type MarkdownPost = BasePost & {
  type: `markdown`
  minutesToRead: number
  content: string
}

export type HrefPost = BasePost & { type: `href`; href: string }

type BasePost = {
  id: string
  title: string
  tags: Set<string>
  dates: {
    published: Date
    updated?: Date
  }
  references: Map<string, Set<string>>
  referencedBy: Set<string>
}
