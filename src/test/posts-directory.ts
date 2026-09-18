import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, vi } from 'vitest'
import type { PostType } from '~/services/post-keys.server.ts'

/**
 * Points the private directory at a fresh temporary directory for each test
 * and returns a function that writes a post file into it.
 */
export const usePostsDirectory = (): {
  writePost: (type: PostType, name: string, content?: string) => Promise<void>
  postPath: (type: PostType, name: string) => string
} => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(join(tmpdir(), `website-posts-`))
    await fs.mkdir(join(root, `private`, `posts`, `href`), { recursive: true })
    await fs.mkdir(join(root, `private`, `posts`, `markdown`), {
      recursive: true,
    })
    vi.spyOn(process, `cwd`).mockReturnValue(root)
    vi.resetModules()
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })

  const postPath = (type: PostType, name: string) =>
    join(root, `private`, `posts`, type, name)

  return {
    postPath,
    writePost: (type, name, content = ``) =>
      fs.writeFile(postPath(type, name), content),
  }
}

export const frontMatter = (lines: string[]): string =>
  [`---`, ...lines, `---`, ``].join(`\n`)

/** Front matter for a post with the given title, tags, and published day. */
export const postFrontMatter = ({
  title,
  tags = [],
  day = 1,
  extraLines = [],
}: {
  title: string
  tags?: string[]
  day?: number
  extraLines?: string[]
}): string =>
  frontMatter([
    `title: ${title}`,
    `tags: [${tags.join(`, `)}]`,
    `dates:`,
    `  published: 2024-01-${String(day).padStart(2, `0`)}`,
    ...extraLines,
  ])
