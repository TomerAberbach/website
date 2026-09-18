import sharp from 'sharp'
import { expect, test } from 'vitest'
import {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from '~/services/thumbnail-constants.ts'
import { usePostsFixture } from '~/test/posts-fixture.ts'

usePostsFixture()

const load = async (postId: string) => {
  const { loader } = await import(`./post.png.tsx`)
  return loader({
    params: { postId },
    request: new Request(`http://localhost:3000/${postId}.png`),
    context: {},
  } as unknown as Parameters<typeof loader>[0])
}

test(`a known markdown post renders a png thumbnail`, async () => {
  const response = await load(`newer-post`)

  expect(response.headers.get(`Content-Type`)).toBe(`image/png`)
  const image = Buffer.from(await response.arrayBuffer())
  expect(response.headers.get(`Content-Length`)).toBe(String(image.length))
  expect(await sharp(image).metadata()).toMatchObject({
    format: `png`,
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  })
})

test.each([`missing`, `elsewhere`])(
  `a post with id %j has no thumbnail`,
  async postId => {
    const response = await load(postId)

    expect(response.status).toBe(404)
  },
)
