import { first, get, join, map, pipe, values } from 'lfi'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/services/meta.ts'
import { formatDateUTC, formatDatesUTC } from '~/services/format.ts'
import { getMarkdownPosts } from '~/services/posts/index.server.ts'
import { SITE_URL, getSiteUrl } from '~/services/url.ts'

export const loader = async (): Promise<Response> => {
  const posts = await getMarkdownPosts()
  const rss = `
    <rss version="2.0"
         xmlns:atom="http://www.w3.org/2005/Atom"
         xmlns:content="http://purl.org/rss/1.0/modules/content">
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
                ${pipe(
                  post.tags,
                  map(tag => `<category>${cdata(tag)}</category>`),
                  join(``),
                )}
                <content:encoded>${cdata(post.content)}</content:encoded>
                <description>${cdata(post.description)}</description>
                <guid isPermaLink="true">${url}</guid>
                <pubDate>${formatDateUTC(post.dates.published)}</pubDate>
                ${
                  post.dates.updated
                    ? `<lastBuildDate>${formatDateUTC(
                        post.dates.updated,
                      )}</lastBuildDate>`
                    : ``
                }
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
