import sharp from 'sharp'
import { expect, test } from 'vitest'
import type { MarkdownPost } from './post.server.ts'
import { renderThumbnail } from './render-thumbnail.server.tsx'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail-constants.ts'

const post: MarkdownPost = {
  id: `long-post`,
  type: `markdown`,
  title: `A title long enough to wrap onto several lines of the thumbnail image`,
  tags: new Set([`code`, `music`, `writing`]),
  dates: { published: new Date(`2024-01-02`), updated: new Date(`2024-03-04`) },
  references: new Map(),
  referencedBy: new Map(),
  minutesToRead: 7,
  html: `<p>Hello</p>`,
  description: `Hello`,
  features: new Set(),
}

test(`the thumbnail is a png with the open graph dimensions`, async () => {
  const image = await renderThumbnail(post)

  const metadata = await sharp(image).metadata()
  expect(metadata).toMatchObject({
    format: `png`,
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  })
})
