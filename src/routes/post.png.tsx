import { invariant } from '@epic-web/invariant'
import type { LoaderFunctionArgs } from 'react-router'
import { getPostKeys } from '~/services/post-keys.server.ts'
import { getMarkdownPost } from '~/services/post.server.ts'
import { renderThumbnail } from '~/services/render-thumbnail.server.tsx'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { postId } = params
  invariant(
    postId,
    `Expected a non-empty postId in params: ${JSON.stringify(params)}`,
  )

  const postKey = (await getPostKeys()).get(postId)
  if (postKey?.type !== `markdown`) {
    return new Response(`Not found`, { status: 400 })
  }

  const post = await getMarkdownPost(postKey)
  const image = await renderThumbnail(post)
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': `image/png`,
      'Content-Length': String(Buffer.byteLength(image)),
    },
  })
}
