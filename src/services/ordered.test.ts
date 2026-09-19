import { expect, test } from 'vitest'
import {
  frontMatter,
  postFrontMatter,
  usePostsDirectory,
} from '~/test/posts-directory.ts'

const { writePost } = usePostsDirectory()

const getOrderedPosts = async () =>
  (await import(`./ordered.ts`)).getOrderedPosts()

const getOrderedMarkdownPosts = async () =>
  (await import(`./ordered.ts`)).getOrderedMarkdownPosts()

// Published in this order: oldest, external, middle, newest.
const writeFixturePosts = async () => {
  await writePost(
    `markdown`,
    `oldest.md`,
    `${postFrontMatter({ title: `Oldest`, day: 1 })}\nSee [newest](/newest).\n`,
  )
  await writePost(
    `href`,
    `external.md`,
    frontMatter([
      `title: External`,
      `tags: []`,
      `dates:`,
      `  published: 2024-01-02`,
      `href: https://example.com`,
      `hrefs: [middle]`,
    ]),
  )
  await writePost(
    `markdown`,
    `middle.md`,
    `${postFrontMatter({ title: `Middle`, day: 3 })}\nSee [oldest](/oldest), [newest](newest), and [elsewhere](https://elsewhere.org).\n`,
  )
  await writePost(
    `markdown`,
    `newest.md`,
    `${postFrontMatter({ title: `Newest`, day: 4 })}\nSee [middle](/middle).\n`,
  )
}

test(`getOrderedPosts orders posts from newest to oldest`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect([...posts.keys()]).toEqual([
    `newest`,
    `middle`,
    `https://example.com`,
    `oldest`,
  ])
})

test(`getOrderedPosts links each markdown post to its markdown neighbors`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect(posts.get(`newest`)).toMatchObject({
    previous: { id: `middle`, title: `Middle` },
  })
  expect(posts.get(`middle`)).toMatchObject({
    next: { id: `newest`, title: `Newest` },
    previous: { id: `oldest`, title: `Oldest` },
  })
  expect(posts.get(`oldest`)).toMatchObject({
    next: { id: `middle`, title: `Middle` },
  })
})

test(`getOrderedPosts leaves the ends of the markdown post chain unlinked`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect(posts.get(`newest`)).not.toHaveProperty(`next`)
  expect(posts.get(`oldest`)).not.toHaveProperty(`previous`)
})

test(`getOrderedPosts leaves href posts out of the neighbor chain`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect(posts.get(`https://example.com`)).not.toHaveProperty(`previous`)
  expect(posts.get(`https://example.com`)).not.toHaveProperty(`next`)
})

test(`getOrderedPosts fills referencedBy from the posts that link to each post`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect(posts.get(`newest`)!.referencedBy).toEqual(
    new Map([
      [`middle`, `Middle`],
      [`oldest`, `Oldest`],
    ]),
  )
  expect(posts.get(`middle`)!.referencedBy).toEqual(
    new Map([
      [`newest`, `Newest`],
      [`https://example.com`, `External`],
    ]),
  )
  expect(posts.get(`https://example.com`)!.referencedBy).toEqual(new Map())
})

test(`getOrderedPosts orders referencedBy from newest to oldest`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedPosts()

  expect([...posts.get(`middle`)!.referencedBy.keys()]).toEqual([
    `newest`,
    `https://example.com`,
  ])
})

test(`getOrderedMarkdownPosts excludes href posts`, async () => {
  await writeFixturePosts()

  const posts = await getOrderedMarkdownPosts()

  expect([...posts.keys()]).toEqual([`newest`, `middle`, `oldest`])
})
