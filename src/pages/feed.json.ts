import type { APIRoute } from 'astro'
import { map, pipe, reduce, toArray } from 'lfi'
import avatarPath from '~/assets/media/avatar.png?url'
import { formatDateISO } from '~/lib/format.ts'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/lib/meta.ts'
import { getOrderedMarkdownPosts } from '~/lib/ordered.ts'
import { getSiteUrl, SITE_URL } from '~/lib/site-url.ts'

export const GET: APIRoute = async () => {
  const feed = {
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
  }

  return new Response(JSON.stringify(feed), {
    headers: { 'Content-Type': `application/json` },
  })
}
