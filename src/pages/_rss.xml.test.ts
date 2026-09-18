import { expect, test } from 'vitest'
import { usePostsFixture } from '~/test/posts-fixture.ts'

usePostsFixture()

const loadRss = async () => {
  const { GET } = await import(`./rss.xml.ts`)
  // eslint-disable-next-line new-cap
  const response = await GET({} as Parameters<typeof GET>[0])
  const body = await response.text()
  return { response, body, items: body.split(`<item>`).slice(1) }
}

test(`the rss feed is served as xml`, async () => {
  const { response, body } = await loadRss()

  expect(response.headers.get(`Content-Type`)).toBe(`application/xml`)
  expect(response.headers.get(`Content-Length`)).toBe(
    String(Buffer.byteLength(body)),
  )
  expect(body.trim()).toMatch(/^<rss version="2.0"[\s\S]*<\/rss>$/u)
})

test(`the rss channel links to itself and the site`, async () => {
  const { body } = await loadRss()

  expect(body).toContain(
    `<atom:link href="http://localhost:3000/rss.xml" rel="self" type="application/rss+xml" />`,
  )
  expect(body).toContain(`<link>http://localhost:3000</link>`)
  expect(body).toContain(`<title><![CDATA[Tomer Aberbach]]></title>`)
})

test(`the channel last build date is the newest post's date`, async () => {
  const { body } = await loadRss()

  const [channel] = body.split(`<item>`)
  expect(channel).toContain(
    `<lastBuildDate>Mon, 06 May 2024 00:00:00 GMT</lastBuildDate>`,
  )
})

test(`the rss feed lists the markdown posts newest first`, async () => {
  const { items } = await loadRss()

  expect(
    items.map(
      item => /<title>(?<title>.*?)<\/title>/u.exec(item)!.groups!.title,
    ),
  ).toEqual([
    `<![CDATA[Newer Post]]>`,
    `<![CDATA[Older Post]]>`,
    `<![CDATA[Oldest Post]]>`,
  ])
})

test(`an rss item links to the post with a permalink guid`, async () => {
  const { items } = await loadRss()

  expect(items[0]).toContain(`<link>http://localhost:3000/newer-post</link>`)
  expect(items[0]).toContain(
    `<guid isPermaLink="true">http://localhost:3000/newer-post</guid>`,
  )
})

test(`an rss item has a category per tag and a publish date`, async () => {
  const { items } = await loadRss()

  expect(items[0]).toContain(
    `<category><![CDATA[code]]></category><category><![CDATA[writing]]></category>`,
  )
  expect(items[0]).toContain(`<pubDate>Mon, 04 Mar 2024 00:00:00 GMT</pubDate>`)
})

test(`an rss item carries the post html and description`, async () => {
  const { items } = await loadRss()

  expect(items[0]).toMatch(/<content:encoded><!\[CDATA\[<p>.*<\/p>\]\]>/u)
  expect(items[0]).toContain(
    `<description><![CDATA[Some text that links to the older post. ]]></description>`,
  )
})

test(`an updated post has an atom updated date and an unchanged post has none`, async () => {
  const { items } = await loadRss()

  expect(items[0]).toContain(
    `<atom:updated>2024-05-06T00:00:00.000Z</atom:updated>`,
  )
  expect(items[1]).not.toContain(`<atom:updated>`)
})
