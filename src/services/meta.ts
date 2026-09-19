import { concat, join, map } from 'lfi'
import { formatDatesForDisplay, formatMinutesToRead } from './format.ts'
import type { MarkdownPost } from './post.ts'
import { getSiteUrl } from './site-url.ts'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail-constants.ts'

/** What a page's head says about it. */
export type MetaOptions = {
  title: string
  description: string
  keywords?: ReadonlySet<string>
  post?: Pick<MarkdownPost, `id` | `title` | `tags` | `dates` | `minutesToRead`>
  type: `website` | `article`
}

export type Meta = {
  title: string
  canonicalUrl: string
  tags: MetaTag[]
}

/** A `meta` element in the head. */
type MetaTag =
  { name: string; content: string } | { property: string; content: string }

export const getMeta = (
  pathname: string,
  { title, description, keywords = new Set(), post, type }: MetaOptions,
): Meta => {
  const url = getSiteUrl(pathname)
  const baseMeta: MetaTag[] = [
    { name: `description`, content: description },
    {
      name: `keywords`,
      content: join(`, `, new Set(concat(SITE_KEYWORDS, keywords))),
    },
    { name: `author`, content: SITE_TITLE_AND_AUTHOR },
  ]

  if (!post) {
    return { title, canonicalUrl: url, tags: baseMeta }
  }

  const postImageUrl = getSiteUrl(`${post.id}.png`)
  const postImageAlt = `${post.title}. ${formatDatesForDisplay(
    post.dates,
  )}. ${formatMinutesToRead(post.minutesToRead)}. By ${SITE_TITLE_AND_AUTHOR}.`

  const tags = [
    ...baseMeta,
    // https://ogp.me
    { property: `og:title`, content: title },
    { property: `og:description`, content: description },
    { property: `og:url`, content: url },

    { property: `og:image`, content: postImageUrl },
    { property: `og:image:type`, content: `image/png` },
    { property: `og:image:width`, content: String(THUMBNAIL_WIDTH) },
    { property: `og:image:height`, content: String(THUMBNAIL_HEIGHT) },
    { property: `og:image:alt`, content: postImageAlt },

    { property: `og:type`, content: type },
    ...(type === `article` ? getArticleMeta(post) : []),

    // X
    { name: `twitter:card`, content: `summary_large_image` },
    { name: `twitter:site`, content: `@TomerAberbach` },
    { name: `twitter:title`, content: title },
    { name: `twitter:description`, content: description },
    { name: `twitter:image`, content: postImageUrl },
    { name: `twitter:image:alt`, content: postImageAlt },
  ]
  return { title, canonicalUrl: url, tags }
}

const getArticleMeta = ({
  tags,
  dates,
}: Pick<MarkdownPost, `tags` | `dates`>): Iterable<MetaTag> => {
  const baseMeta: MetaTag[] = [
    {
      property: `article:published_time`,
      content: dates.published.toISOString(),
    },
  ]

  if (dates.updated) {
    baseMeta.push({
      property: `article:modified_time`,
      content: dates.updated.toISOString(),
    })
  }

  baseMeta.push({ property: `article:author`, content: SITE_TITLE_AND_AUTHOR })

  return concat(
    baseMeta,
    map(tag => ({ property: `article:tag`, content: tag }), tags),
  )
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
