import { concat, join, map } from 'lfi'
import type { Location } from '@remix-run/react'
import type {
  // eslint-disable-next-line camelcase
  V2_HtmlMetaDescriptor as HtmlMetaDescriptor,
} from '@remix-run/node'
import type { MarkdownPost } from './posts/types.js'
import { formatDatesForDisplay, formatMinutesToRead } from './format.js'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail.js'
import { getSiteUrl } from './url.js'

export const getMeta = (
  location: Location,
  {
    title,
    description,
    keywords = new Set(),
    post,
    type,
  }: {
    title: string
    description: string
    keywords?: ReadonlySet<string>
    post?: Pick<
      MarkdownPost,
      `id` | `title` | `tags` | `dates` | `minutesToRead`
    >
    type: `website` | `article`
  },
): HtmlMetaDescriptor[] => {
  const baseMeta: HtmlMetaDescriptor[] = [
    { title },
    { name: `description`, content: description },
    {
      name: `keywords`,
      content: join(`, `, new Set(concat(SITE_KEYWORDS, keywords))),
    },
    { name: `author`, author: SITE_TITLE_AND_AUTHOR },
  ]

  if (!post) {
    return baseMeta
  }

  // https://ogp.me
  return baseMeta.concat([
    { property: `og:title`, content: title },
    { property: `og:description`, content: description },
    {
      property: `og:url`,
      content: getSiteUrl(location.pathname),
    },

    { property: `og:image`, content: getSiteUrl(`${post.id}.png`) },
    { property: `og:image:type`, content: `image/png` },
    { property: `og:image:width`, content: String(THUMBNAIL_WIDTH) },
    { property: `og:image:height`, content: String(THUMBNAIL_HEIGHT) },
    {
      property: `og:image:alt`,
      content: `${post.title}. ${formatDatesForDisplay(
        post.dates,
      )}. ${formatMinutesToRead(
        post.minutesToRead,
      )}. By ${SITE_TITLE_AND_AUTHOR}.`,
    },

    { property: `og:type`, content: type },
    ...(type === `article` ? getArticleMeta(post) : []),
  ])
}

const getArticleMeta = ({
  tags,
  dates,
}: Pick<MarkdownPost, `tags` | `dates`>): Iterable<HtmlMetaDescriptor> => {
  const baseMeta: HtmlMetaDescriptor[] = [
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
