import { expect, test } from 'vitest'
import type { HrefPost, MarkdownPost } from './post.ts'
import {
  frontMatter,
  postFrontMatter,
  usePostsDirectory,
} from '~/test/posts-directory.ts'

const { writePost } = usePostsDirectory()

const getHrefPost = async (id: string) =>
  (await import(`./post.ts`)).getPost({
    id,
    type: `href`,
  }) as Promise<HrefPost>

const getMarkdownPost = async (id: string) =>
  (await import(`./post.ts`)).getPost({
    id,
    type: `markdown`,
  }) as Promise<MarkdownPost>

test(`getPost parses an href post from its front matter`, async () => {
  await writePost(
    `href`,
    `elsewhere.md`,
    frontMatter([
      `title: Elsewhere`,
      `tags: [music, code]`,
      `dates:`,
      `  published: 2024-01-05`,
      `href: https://example.com/elsewhere`,
      `hrefs:`,
      `  - https://www.example.com/related`,
      `  - https://other.org/page`,
    ]),
  )

  const post = await getHrefPost(`elsewhere`)

  expect(post).toEqual({
    id: `https://example.com/elsewhere`,
    type: `href`,
    title: `Elsewhere`,
    href: `https://example.com/elsewhere`,
    tags: new Set([`code`, `music`]),
    dates: { published: new Date(`2024-01-05T00:00:00Z`) },
    referencedBy: new Map(),
    references: new Map([
      [`example.com`, new Set([`https://www.example.com/related`])],
      [`other.org`, new Set([`https://other.org/page`])],
    ]),
  })
})

test(`getPost parses the front matter of a markdown post`, async () => {
  await writePost(
    `markdown`,
    `some-post.md`,
    `${postFrontMatter({
      title: `Some Post`,
      tags: [`music`, `code`],
      day: 5,
      extraLines: [
        `  updated: 2024-03-17`,
        `referencedBy:`,
        `  other-post: Other Post`,
      ],
    })}\nHi.\n`,
  )

  const post = await getMarkdownPost(`some-post`)

  expect(post).toMatchObject({
    id: `some-post`,
    type: `markdown`,
    title: `Some Post`,
    tags: new Set([`code`, `music`]),
    dates: {
      published: new Date(`2024-01-05T00:00:00Z`),
      updated: new Date(`2024-03-17T00:00:00Z`),
    },
    referencedBy: new Map([[`other-post`, `Other Post`]]),
  })
})

test(`getPost derives references from the links in a markdown post`, async () => {
  await writePost(
    `markdown`,
    `linked.md`,
    `${postFrontMatter({ title: `Linked` })}\nSee [this](https://example.com/thing) and [that](/other-post).\n`,
  )

  const post = await getMarkdownPost(`linked`)

  expect(post.references).toEqual(
    new Map([
      [`example.com`, new Set([`https://example.com/thing`])],
      [`other-post`, new Set([`/other-post`])],
    ]),
  )
})

test(`getPost renders the markdown content to html`, async () => {
  await writePost(
    `markdown`,
    `rendered.md`,
    `${postFrontMatter({ title: `Rendered` })}\n# Heading\n\nSome *emphasis*.\n`,
  )

  const post = await getMarkdownPost(`rendered`)

  expect(post.html).toContain(`Heading</h1>`)
  expect(post.html).toContain(`<em>emphasis</em>`)
})

test(`getPost describes a markdown post with its truncated plain text`, async () => {
  const sentence = `This sentence links to [something](https://example.com). `
  await writePost(
    `markdown`,
    `described.md`,
    `${postFrontMatter({ title: `Described` })}\n# Heading\n\n${sentence.repeat(10)}\n`,
  )

  const post = await getMarkdownPost(`described`)

  expect(post.description).toMatch(
    /^Heading This sentence links to something\. .*…$/u,
  )
  expect(post.description.length).toBeLessThanOrEqual(201)
})

test.each([
  [`Hi.`, 1],
  [`word `.repeat(500), 3],
])(
  `getPost rounds the reading time of %j to %i minutes with a minimum of one`,
  async (content, minutesToRead) => {
    await writePost(
      `markdown`,
      `timed.md`,
      `${postFrontMatter({ title: `Timed` })}\n${content}\n`,
    )

    const post = await getMarkdownPost(`timed`)

    expect(post.minutesToRead).toBe(minutesToRead)
  },
)

test.each([
  [`Inline $x^2$ math.`, new Set([`math`])],
  [`No math here.`, new Set()],
])(`getPost records the features of %j as %o`, async (content, features) => {
  await writePost(
    `markdown`,
    `featured.md`,
    `${postFrontMatter({ title: `Featured` })}\n${content}\n`,
  )

  const post = await getMarkdownPost(`featured`)

  expect(post.features).toEqual(features)
})

test(`getPost rejects duplicate tags`, async () => {
  await writePost(
    `markdown`,
    `duplicate-tags.md`,
    `${postFrontMatter({ title: `Duplicate`, tags: [`code`, `code`] })}\nHi.\n`,
  )

  await expect(getMarkdownPost(`duplicate-tags`)).rejects.toThrow()
})

test(`getPost rejects a post without a title`, async () => {
  await writePost(
    `markdown`,
    `untitled.md`,
    `${frontMatter([`tags: []`, `dates:`, `  published: 2024-01-05`])}\nHi.\n`,
  )

  await expect(getMarkdownPost(`untitled`)).rejects.toThrow()
})
