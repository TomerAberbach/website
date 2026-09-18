import type { APIRoute } from 'astro'
import { filter, map, pipe, reduce, toArray } from 'lfi'
import { getPostKeys } from '~/services/post-keys.server.ts'
import type { PostKey } from '~/services/post-keys.server.ts'
import { getMarkdownPost } from '~/services/post.server.ts'
import { renderThumbnail } from '~/services/render-thumbnail.server.tsx'

export const getStaticPaths = async (): Promise<
  { params: { id: string }; props: { key: PostKey } }[]
> =>
  pipe(
    await getPostKeys(),
    filter(([, key]) => key.type === `markdown`),
    map(([id, key]) => ({ params: { id }, props: { key } })),
    reduce(toArray()),
  )

export const GET: APIRoute<{ key: PostKey }> = async ({ props }) => {
  const image = await renderThumbnail(await getMarkdownPost(props.key))
  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': `image/png`,
      'Content-Length': String(Buffer.byteLength(image)),
    },
  })
}
