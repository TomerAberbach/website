import { expect, test } from 'vitest'
import { usePostsDirectory } from '~/test/posts-directory.ts'

const { writePost, postPath } = usePostsDirectory()

const getPostKeys = async () =>
  (await import(`./post-keys.server.ts`)).getPostKeys()

test(`getPostKeys maps each file basename to its post type`, async () => {
  await writePost(`markdown`, `first.md`)
  await writePost(`markdown`, `second.md`)
  await writePost(`href`, `third.md`)

  const keys = await getPostKeys()

  expect(keys).toEqual(
    new Map([
      [`first`, { id: `first`, type: `markdown` }],
      [`second`, { id: `second`, type: `markdown` }],
      [`third`, { id: `third`, type: `href` }],
    ]),
  )
})

test(`getPostKeys skips files starting with an underscore`, async () => {
  await writePost(`markdown`, `_draft.md`)
  await writePost(`markdown`, `published.md`)

  const keys = await getPostKeys()

  expect([...keys.keys()]).toEqual([`published`])
})

test(`getPostKeys throws for a file without the md extension`, async () => {
  await writePost(`markdown`, `notes.txt`)

  await expect(getPostKeys()).rejects.toThrow(`.md`)
})

test(`getPostKeys throws when the same id exists in both types`, async () => {
  await writePost(`markdown`, `same.md`)
  await writePost(`href`, `same.md`)

  await expect(getPostKeys()).rejects.toThrow(`Expected post ID to be unique`)
})

test(`getPostPath joins the private posts directory, type, and id`, async () => {
  const { getPostPath } = await import(`./post-keys.server.ts`)

  const path = getPostPath({ id: `some-post`, type: `markdown` })

  expect(path).toBe(postPath(`markdown`, `some-post.md`))
})
