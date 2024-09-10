import { json } from '@remix-run/server-runtime'
import { map, pipe, reduce, toArray } from 'lfi'
import avatarPath from '~/private/media/avatar.png'
import { formatDateISO } from '~/services/format.ts'
import { SITE_DESCRIPTION, SITE_TITLE_AND_AUTHOR } from '~/services/meta.ts'
import { getMarkdownPosts } from '~/services/posts/index.server.ts'
import { SITE_URL, getSiteUrl } from '~/services/url.ts'

export const loader = async (): Promise<Response> =>
  json({
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
      await getMarkdownPosts(),
      map(([postId, post]) => ({
        id: postId,
        url: getSiteUrl(postId),
        title: post.title,
        content_html: post.content,
        image: getSiteUrl(`${postId}.png`),
        date_published: formatDateISO(post.dates.published),
        ...(post.dates.updated && {
          date_modified: formatDateISO(post.dates.updated),
        }),
        tags: [...post.tags],
      })),
      reduce(toArray()),
    ),
  })
