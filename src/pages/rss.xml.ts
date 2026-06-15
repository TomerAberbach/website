import rss from '@astrojs/rss'
import type { APIRoute } from 'astro'
import { first, get, map, pipe, reduce, toArray, values } from 'lfi'
import { formatDatesUTC, formatDateUTC } from '~/lib/format.ts'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/lib/meta.ts'
import { getOrderedMarkdownPosts } from '~/lib/ordered.ts'
import { getSiteUrl, SITE_URL } from '~/lib/site-url.ts'

export const GET: APIRoute = async () => {
  const posts = await getOrderedMarkdownPosts()

  return rss({
    title: SITE_TITLE_AND_AUTHOR,
    description: SITE_DESCRIPTION,
    // The site uses `trailingSlash: never`; keep feed URLs in sync so `guid`s
    // stay stable for existing subscribers.
    site: SITE_URL,
    trailingSlash: false,
    xmlns: { atom: `http://www.w3.org/2005/Atom` },
    customData: [
      `<language>en-us</language>`,
      `<copyright>© ${SITE_TITLE_AND_AUTHOR}. All rights reserved.</copyright>`,
      `<lastBuildDate>${formatDatesUTC(pipe(posts, values, first, get).dates)}</lastBuildDate>`,
      `<ttl>40</ttl>`,
      `<atom:link href="${getSiteUrl(
        `rss.xml`,
      )}" rel="self" type="application/rss+xml" />`,
    ].join(``),
    items: pipe(
      posts,
      map(([id, post]) => ({
        title: post.title,
        link: getSiteUrl(id),
        pubDate: post.dates.published,
        description: post.description,
        content: post.html,
        categories: [...post.tags],
        ...(post.dates.updated && {
          customData: `<lastBuildDate>${formatDateUTC(post.dates.updated)}</lastBuildDate>`,
        }),
      })),
      reduce(toArray()),
    ),
  })
}
