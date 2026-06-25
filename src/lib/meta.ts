import type { Dates } from './format.ts'

/** The subset of a post's data the SEO tags need (see `Seo.astro`). */
export type SeoPost = {
  id: string
  title: string
  tags: ReadonlySet<string>
  dates: Dates
  minutesToRead: number
}

export type SeoProps = {
  title: string
  description: string
  keywords?: ReadonlySet<string>
  post?: SeoPost
  type: `website` | `article`
}

export const SITE_TITLE_AND_AUTHOR = `Tomer Aberbach`
export const SITE_DESCRIPTION = `The portfolio website and blog of Tomer Aberbach, a New Jersey based software engineer, composer, and music producer.`
export const SITE_KEYWORDS: ReadonlySet<string> = new Set([
  `portfolio`,
  `blog`,
  `computer science`,
  `software engineering`,
  `code`,
  `composition`,
  `music production`,
])
