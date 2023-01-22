import type { LoaderArgs } from '@remix-run/server-runtime'
import assert from '~/services/assert.js'
import { getMarkdownPosts } from '~/services/posts/index.server.js'
import { renderThumbnail } from '~/services/thumbnail.server.js'

export const loader = async ({ params }: LoaderArgs) => {
  const { postId } = params
  assert(postId, `Expected a non-empty postId in params: ${params}`)

  const post = (await getMarkdownPosts()).get(postId)
  if (!post) {
    return new Response(`Not found`, { status: 400 })
  }

  return new Response(await renderThumbnail(post), {
    headers: { 'Content-Type': `image/png` },
  })
}
