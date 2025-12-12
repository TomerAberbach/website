import { map, pipe, reduce, toArray } from 'lfi'
import avatarPath from '~/private/media/avatar.png'
import { formatDateISO } from '~/services/format.ts'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/services/meta.ts'
import { getOrderedMarkdownPosts } from '~/services/ordered.server.ts'
import { getSiteUrl, SITE_URL } from '~/services/site-url.ts'

export const loader = async (): Promise<Record<string, unknown>> => ({
  version: `https://jsonfeed.org/version/1.1`,
  title: SITE_TITLE_AND_AUTHOR,
  home_page_url: SITE_URL,
  feed_url: getSiteUrl(`feed.json`),
  description: SITE_DESCRIPTION,
  authors: [
    {
      name: SITE_TITLE_AND_AUTHOR,
      url: SITE_URL,
      avatar: getSiteUrl(avatarPath),
    },
  ],
  language: `en-US`,
  items: pipe(
    await getOrderedMarkdownPosts(),
    map(([id, post]) => ({
      id,
      url: getSiteUrl(id),
      title: post.title,
      content_html: post.html,
      image: getSiteUrl(`${id}.png`),
      date_published: formatDateISO(post.dates.published),
      ...(post.dates.updated && {
        date_modified: formatDateISO(post.dates.updated),
      }),
      tags: [...post.tags],
    })),
    reduce(toArray()),
  ),
})
