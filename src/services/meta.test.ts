import { expect, test } from 'vitest'
import { getMeta, SITE_KEYWORDS, SITE_TITLE_AND_AUTHOR } from './meta.ts'

const pathname = `/some-post`

const post = {
  id: `some-post`,
  title: `Some Post`,
  tags: new Set([`code`, `music`]),
  dates: { published: new Date(`2024-01-05T00:00:00Z`) },
  minutesToRead: 4,
}

const website = {
  title: `Title`,
  description: `Description`,
  type: `website`,
} as const
const article = { ...website, post, type: `article` } as const

const withProperty = (prefix: string): unknown =>
  expect.objectContaining({
    property: expect.stringMatching(`^${prefix}`) as unknown,
  })
const withName = (prefix: string): unknown =>
  expect.objectContaining({
    name: expect.stringMatching(`^${prefix}`) as unknown,
  })

test(`getMeta includes the title, canonical link, description, and author`, () => {
  const meta = getMeta(pathname, website)

  expect(meta).toEqual(
    expect.arrayContaining([
      { title: `Title` },
      {
        tagName: `link`,
        rel: `canonical`,
        href: `http://localhost:3000/some-post`,
      },
      { name: `description`, content: `Description` },
      { name: `author`, content: SITE_TITLE_AND_AUTHOR },
    ]),
  )
})

test(`getMeta uses the site keywords when none are given`, () => {
  const meta = getMeta(pathname, website)

  expect(meta).toContainEqual({
    name: `keywords`,
    content: [...SITE_KEYWORDS].join(`, `),
  })
})

test(`getMeta appends the given keywords to the site keywords without duplicates`, () => {
  const meta = getMeta(pathname, {
    ...website,
    keywords: new Set([`code`, `jazz`]),
  })

  expect(meta).toContainEqual({
    name: `keywords`,
    content: [...SITE_KEYWORDS, `jazz`].join(`, `),
  })
})

test(`getMeta without a post has no open graph or twitter meta`, () => {
  const meta = getMeta(pathname, website)

  expect(meta).not.toContainEqual(withProperty(`og:`))
  expect(meta).not.toContainEqual(withName(`twitter:`))
})

test(`getMeta with a post adds open graph meta with the post thumbnail`, () => {
  const meta = getMeta(pathname, { ...website, post })

  expect(meta).toEqual(
    expect.arrayContaining([
      { property: `og:title`, content: `Title` },
      { property: `og:description`, content: `Description` },
      { property: `og:url`, content: `http://localhost:3000/some-post` },
      { property: `og:image`, content: `http://localhost:3000/some-post.png` },
      { property: `og:type`, content: `website` },
    ]),
  )
})

test(`getMeta with a post adds twitter meta with the post thumbnail`, () => {
  const meta = getMeta(pathname, { ...website, post })

  expect(meta).toEqual(
    expect.arrayContaining([
      { name: `twitter:card`, content: `summary_large_image` },
      { name: `twitter:title`, content: `Title` },
      { name: `twitter:image`, content: `http://localhost:3000/some-post.png` },
    ]),
  )
})

test(`getMeta describes the thumbnail with the title, date, reading time, and author`, () => {
  const meta = getMeta(pathname, { ...website, post })

  expect(meta).toContainEqual({
    property: `og:image:alt`,
    content: `Some Post. Published January 5, 2024. 4 min read. By ${SITE_TITLE_AND_AUTHOR}.`,
  })
})

test(`getMeta with a website post has no article meta`, () => {
  const meta = getMeta(pathname, { ...website, post })

  expect(meta).not.toContainEqual(withProperty(`article:`))
})

test(`getMeta with an article adds the published time and author`, () => {
  const meta = getMeta(pathname, article)

  expect(meta).toEqual(
    expect.arrayContaining([
      { property: `og:type`, content: `article` },
      {
        property: `article:published_time`,
        content: `2024-01-05T00:00:00.000Z`,
      },
      { property: `article:author`, content: SITE_TITLE_AND_AUTHOR },
    ]),
  )
})

test(`getMeta with an article adds one tag meta per tag`, () => {
  const meta = getMeta(pathname, article)

  expect(
    meta.filter(
      descriptor =>
        `property` in descriptor && descriptor.property === `article:tag`,
    ),
  ).toEqual([
    { property: `article:tag`, content: `code` },
    { property: `article:tag`, content: `music` },
  ])
})

test(`getMeta with an article omits the modified time when there is no updated date`, () => {
  const meta = getMeta(pathname, article)

  expect(meta).not.toContainEqual(withProperty(`article:modified_time`))
})

test(`getMeta with an updated article adds the modified time`, () => {
  const meta = getMeta(pathname, {
    ...article,
    post: {
      ...post,
      dates: { ...post.dates, updated: new Date(`2024-03-17T00:00:00Z`) },
    },
  })

  expect(meta).toContainEqual({
    property: `article:modified_time`,
    content: `2024-03-17T00:00:00.000Z`,
  })
})
