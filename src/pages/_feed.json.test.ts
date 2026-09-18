import { expect, test } from 'vitest'
import { usePostsFixture } from '~/test/posts-fixture.ts'

usePostsFixture()

const loadFeed = async () => {
  const { getFeed } = await import(`./feed.json.ts`)
  return getFeed()
}

test(`the json feed is served as json`, async () => {
  const { GET } = await import(`./feed.json.ts`)

  // eslint-disable-next-line new-cap
  const response = await GET({} as Parameters<typeof GET>[0])

  expect(response.headers.get(`Content-Type`)).toBe(
    `application/json; charset=utf-8`,
  )
  expect(await response.json()).toMatchObject({
    version: `https://jsonfeed.org/version/1.1`,
  })
})

test(`the json feed describes the site`, async () => {
  const feed = await loadFeed()

  expect(feed).toMatchObject({
    version: `https://jsonfeed.org/version/1.1`,
    title: `Tomer Aberbach`,
    home_page_url: `http://localhost:3000`,
    feed_url: `http://localhost:3000/feed.json`,
    language: `en-US`,
  })
})

test(`the json feed lists the markdown posts newest first`, async () => {
  const feed = await loadFeed()

  const items = feed.items as { id: string }[]
  expect(items.map(item => item.id)).toEqual([
    `newer-post`,
    `older-post`,
    `oldest-post`,
  ])
})

test(`a json feed item links to the post and its thumbnail`, async () => {
  const feed = await loadFeed()

  const [item] = feed.items as [Record<string, unknown>]
  expect(item).toMatchObject({
    id: `newer-post`,
    url: `http://localhost:3000/newer-post`,
    title: `Newer Post`,
    image: `http://localhost:3000/newer-post.png`,
    tags: [`code`, `writing`],
    date_published: `2024-03-04T00:00:00.000Z`,
  })
  expect(item.content_html).toContain(`<p>`)
})

test(`a json feed item has a modified date only when the post was updated`, async () => {
  const feed = await loadFeed()

  const [newer, older] = feed.items as Record<string, unknown>[]
  expect(newer!.date_modified).toBe(`2024-05-06T00:00:00.000Z`)
  expect(older!).not.toHaveProperty(`date_modified`)
})
