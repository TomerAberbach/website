import { invariant } from '@epic-web/invariant'
import type { LoaderFunctionArgs } from '@remix-run/server-runtime'
import { getMarkdownPosts } from '~/services/posts/index.server.ts'
import { renderThumbnail } from '~/services/thumbnail.server.tsx'

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { postId } = params
  invariant(
    postId,
    `Expected a non-empty postId in params: ${JSON.stringify(params)}`,
  )

  const post = (await getMarkdownPosts()).get(postId)
  if (!post) {
    return new Response(`Not found`, { status: 400 })
  }

  const image = await renderThumbnail(post)
  return new Response(image, {
    headers: {
      'Content-Type': `image/png`,
      'Content-Length': String(Buffer.byteLength(image)),
    },
  })
}
