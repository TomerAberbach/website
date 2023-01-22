/* eslint-disable camelcase */

import { concat, join, map } from 'lfi'
import type { Location } from '@remix-run/react'
import type { V2_HtmlMetaDescriptor } from '@remix-run/node'
import type { MarkdownPost } from './posts/types.js'
import { formatDates, formatMinutesToRead } from './format.js'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail.js'

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
): V2_HtmlMetaDescriptor[] => {
  const baseMeta: V2_HtmlMetaDescriptor[] = [
    { title },
    { name: `description`, content: description },
    {
      name: `keywords`,
      content: join(`, `, new Set(concat(DEFAULT_KEYWORDS, keywords))),
    },
    { name: `author`, author: AUTHOR },
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
      content: removeTrailingSlash(
        `https://tomeraberba.ch${location.pathname}`,
      ),
    },

    { property: `og:image`, content: `https://tomeraberba.ch/${post.id}.png` },
    { property: `og:image:type`, content: `image/png` },
    { property: `og:image:width`, content: String(THUMBNAIL_WIDTH) },
    { property: `og:image:height`, content: String(THUMBNAIL_HEIGHT) },
    {
      property: `og:image:alt`,
      content: `${post.title}. ${formatDates(
        post.dates,
      )}. ${formatMinutesToRead(post.minutesToRead)}. By ${AUTHOR}.`,
    },

    { property: `og:type`, content: type },
    ...(type === `article` ? getArticleMeta(post) : []),
  ])
}

const getArticleMeta = ({
  tags,
  dates,
}: Pick<MarkdownPost, `tags` | `dates`>): Iterable<V2_HtmlMetaDescriptor> => {
  const baseMeta: V2_HtmlMetaDescriptor[] = [
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

  baseMeta.push({ property: `article:author`, content: AUTHOR })

  return concat(
    baseMeta,
    map(tag => ({ property: `article:tag`, content: tag }), tags),
  )
}

export const AUTHOR = `Tomer Aberbach`

const DEFAULT_KEYWORDS: ReadonlySet<string> = new Set([
  `portfolio`,
  `blog`,
  `computer science`,
  `software engineering`,
  `code`,
  `composition`,
  `music production`,
])

const removeTrailingSlash = (url: string) =>
  url.endsWith(`/`) ? url.slice(0, -1) : url
