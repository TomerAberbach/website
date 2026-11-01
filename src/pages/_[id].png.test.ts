import sharp from 'sharp'
import { expect, test } from 'vitest'
import {
  THUMBNAIL_HEIGHT,
  THUMBNAIL_WIDTH,
} from '~/services/thumbnail-constants.ts'
import { setUpPostsFixture } from '~/testing/posts-fixture.ts'

setUpPostsFixture()

test(`every markdown post gets a thumbnail path`, async () => {
  const { getStaticPaths } = await import(`./[id].png.ts`)

  const paths = await getStaticPaths()

  expect(paths.map(({ params }) => params.id)).toStrictEqual([
    `newer-post`,
    `older-post`,
    `oldest-post`,
  ])
})

test(`a markdown post renders a png thumbnail`, async () => {
  const { GET, getStaticPaths } = await import(`./[id].png.ts`)
  const { props } = (await getStaticPaths())[0]!

  // eslint-disable-next-line new-cap
  const response = await GET({ props } as Parameters<typeof GET>[0])

  expect(response.headers.get(`Content-Type`)).toBe(`image/png`)
  const image = Buffer.from(await response.arrayBuffer())
  expect(response.headers.get(`Content-Length`)).toBe(String(image.length))
  await expect(sharp(image).metadata()).resolves.toMatchObject({
    format: `png`,
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  })
})
