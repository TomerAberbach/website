import { invariant } from '@epic-web/invariant'
import type { LoaderFunctionArgs } from 'react-router'
import { getPostKeys } from '~/services/post-keys.server'
import { getMarkdownPost } from '~/services/post.server'
import { renderThumbnail } from '~/services/render-thumbnail.server'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { postId } = params
  invariant(
    postId,
    `Expected a non-empty postId in params: ${JSON.stringify(params)}`,
  )

  const postKey = (await getPostKeys()).get(postId)
  if (!postKey || postKey.type !== `markdown`) {
    return new Response(`Not found`, { status: 400 })
  }

  const post = await getMarkdownPost(postKey)
  const image = await renderThumbnail(post)
  return new Response(image, {
    headers: {
      'Content-Type': `image/png`,
      'Content-Length': String(Buffer.byteLength(image)),
    },
  })
}
