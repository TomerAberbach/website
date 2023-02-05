import { json } from '@remix-run/server-runtime'
import { map, pipe, reduce, toArray } from 'lfi'
import { formatDateISO } from '~/services/format.js'
import {
  SITE_DESCRIPTION,
  SITE_TITLE_AND_AUTHOR,
  SITE_URL,
} from '~/services/meta.js'
import { getMarkdownPosts } from '~/services/posts/index.server.js'

export const loader = async (): Promise<Response> =>
  json(
    /* eslint-disable camelcase */
    {
      version: `https://jsonfeed.org/version/1.1`,
      title: SITE_TITLE_AND_AUTHOR,
      home_page_url: SITE_URL,
      feed_url: `${SITE_URL}/feed.json`,
      description: SITE_DESCRIPTION,
      authors: [
        {
          name: SITE_TITLE_AND_AUTHOR,
          url: SITE_URL,
          avatar: `${SITE_URL}/avatar.png`,
        },
      ],
      language: `en-US`,
      items: pipe(
        await getMarkdownPosts(),
        map(([postId, post]) => ({
          id: postId,
          url: `${SITE_URL}/${postId}`,
          title: post.title,
          content_html: post.content,
          image: `${SITE_URL}/${postId}.png`,
          date_published: formatDateISO(post.dates.published),
          ...(post.dates.updated && {
            date_modified: formatDateISO(post.dates.updated),
          }),
          tags: [...post.tags],
        })),
        reduce(toArray()),
      ),
    },
    /* eslint-enable camelcase */
  )
