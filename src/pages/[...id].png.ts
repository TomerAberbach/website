import type { APIRoute, GetStaticPaths } from 'astro'
import { map, pipe, reduce, toArray } from 'lfi'
import { getOrderedMarkdownPosts } from '~/lib/ordered.ts'
import type { MarkdownPost } from '~/lib/post.ts'
import { renderThumbnail } from '~/lib/render-thumbnail.tsx'

export const getStaticPaths: GetStaticPaths = async () =>
  pipe(
    await getOrderedMarkdownPosts(),
    map(([id, post]) => ({ params: { id }, props: { post } })),
    reduce(toArray()),
  )

export const GET: APIRoute<{ post: MarkdownPost }> = async ({ props }) => {
  const image = await renderThumbnail(props.post)
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': `image/png`,
      'Content-Length': String(image.length),
    },
  })
}
