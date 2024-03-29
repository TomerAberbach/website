import { first, get, join, map, pipe, values } from 'lfi'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/services/meta.js'
import { formatDateUTC, formatDatesUTC } from '~/services/format.js'
import { getMarkdownPosts } from '~/services/posts/index.server.js'
import { SITE_URL, getSiteUrl } from '~/services/url.js'

export const loader = async (): Promise<Response> => {
  const posts = await getMarkdownPosts()
  const rss = `
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <atom:link href="${getSiteUrl(
          `rss.xml`,
        )}" rel="self" type="application/rss+xml" />
        <title>${cdata(SITE_TITLE_AND_AUTHOR)}</title>
        <link>${SITE_URL}</link>
        <description>${cdata(SITE_DESCRIPTION)}</description>
        <language>en-us</language>
        <copyright>${cdata(
          `© ${SITE_TITLE_AND_AUTHOR}. All rights reserved.`,
        )}</copyright>
        <lastBuildDate>${formatDatesUTC(
          pipe(values(posts), first, get).dates,
        )}</lastBuildDate>
        <ttl>40</ttl>
        ${pipe(
          posts,
          map(([postId, post]) => {
            const url = getSiteUrl(postId)
            return `
              <item>
                <title>${cdata(post.title)}</title>
                <link>${url}</link>
                <description>${cdata(post.description)}</description>
                <guid isPermaLink="true">${url}</guid>
                <pubDate>${formatDateUTC(post.dates.published)}</pubDate>
              </item>
            `
          }),
          join(``),
        )}
      </channel>
    </rss>
  `

  return new Response(rss, {
    headers: {
      'Content-Type': `application/xml`,
      'Content-Length': String(Buffer.byteLength(rss)),
    },
  })
}

const cdata = (string: string) => `<![CDATA[${string}]]>`
