import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, vi } from 'vitest'

/**
 * Points the private directory at a temporary directory with three markdown
 * posts and one href post for the whole file, so post loading reads the fixture
 * instead of the real posts.
 */
export const usePostsFixture = (): void => {
  let root: string

  beforeAll(async () => {
    root = await createFixture()
    vi.spyOn(process, `cwd`).mockReturnValue(root)
    vi.resetModules()
  })

  afterAll(async () => {
    vi.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })
}

const createFixture = async (): Promise<string> => {
  const originalCwd = process.cwd()
  const root = await fs.mkdtemp(join(tmpdir(), `website-posts-`))

  const markdownPath = join(root, `private`, `posts`, `markdown`)
  const hrefPath = join(root, `private`, `posts`, `href`)
  const mediaPath = join(root, `private`, `media`)
  await Promise.all([
    fs.mkdir(markdownPath, { recursive: true }),
    fs.mkdir(hrefPath, { recursive: true }),
    fs.mkdir(mediaPath, { recursive: true }),
  ])
  await Promise.all([
    fs.writeFile(join(markdownPath, `newer-post.md`), NEWER_POST),
    fs.writeFile(join(markdownPath, `older-post.md`), OLDER_POST),
    fs.writeFile(join(markdownPath, `oldest-post.md`), OLDEST_POST),
    fs.writeFile(join(hrefPath, `elsewhere.md`), HREF_POST),
    fs.copyFile(
      join(originalCwd, `private`, `media`, `logo.svg`),
      join(mediaPath, `logo.svg`),
    ),
    fs.copyFile(
      join(originalCwd, `private`, `media`, `avatar.png`),
      join(mediaPath, `avatar.png`),
    ),
  ])

  return root
}

const NEWER_POST = `---
title: Newer Post
tags:
  - code
  - writing
dates:
  published: 2024-03-04
  updated: 2024-05-06
---

Some text that links to [the older post](/older-post).
`

const OLDER_POST = `---
title: Older Post
tags:
  - music
dates:
  published: 2024-01-02
---

Some text with a [link](https://example.com/page).
`

const OLDEST_POST = `---
title: Oldest Post
tags:
  - music
dates:
  published: 2023-11-12
---

The first post.
`

const HREF_POST = `---
title: Elsewhere
href: https://example.com/elsewhere
hrefs:
  - https://example.com/other
tags:
  - code
dates:
  published: 2023-12-31
---
`
