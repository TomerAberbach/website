import { basename, join } from 'path'
import fs from 'fs/promises'
import { asConcur, mapConcur, pipe } from 'lfi'
import type { ConcurIterable } from 'lfi'
import { Octokit } from 'octokit'
import assert from '~/services/assert.js'

const fetchGitHubPosts = async (): Promise<ConcurIterable<RawPost>> =>
  pipe(
    asConcur(await fetchGitHubRepositoryDirectory(POSTS_PATH)),
    mapConcur(async ({ type, name, path }) => {
      assert(type === `file`, `Expected ${path} to be a file, but was: ${type}`)

      return {
        id: parseId(name),
        content: getFileContent(await fetchGitHubRepositoryFile(path)),
      }
    }),
  )

const fetchGitHubRepositoryDirectory = async (path: string) => {
  const response = await fetchGitHubRepositoryContents(path)
  const files = response.data

  assert(Array.isArray(files), `Expected ${path} to be a directory`)

  return files
}

const fetchGitHubRepositoryFile = async (path: string) => {
  const response = await fetchGitHubRepositoryContents(path)
  const file = response.data

  assert(
    !Array.isArray(file) && file.type === `file`,
    `Expected ${file} to be a file`,
  )

  return file
}

const fetchGitHubRepositoryContents = (path: string) =>
  new Octokit({ auth: process.env.GITHUB_TOKEN }).request(
    `GET /repos/{owner}/{repo}/contents/{path}`,
    {
      owner: `TomerAberbach`,
      repo: `website`,
      path,
    },
  )

const getFileContent = ({
  encoding,
  content,
}: {
  readonly encoding: string
  readonly content: string
}): string => {
  if (encoding !== `base64`) {
    return content
  }

  return Buffer.from(content, `base64`).toString(`utf8`)
}

const getLocalPosts = async (): Promise<ConcurIterable<RawPost>> => {
  const postsDirectory = join(process.cwd(), POSTS_PATH)

  return pipe(
    asConcur(await fs.readdir(postsDirectory)),
    mapConcur(async name => ({
      id: parseId(name),
      content: await fs.readFile(join(postsDirectory, name), `utf8`),
    })),
  )
}

export type RawPost = { id: string; content: string }

const POSTS_PATH = `src/posts`

const parseId = (name: string): string => {
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`

export const fetchRawPosts =
  process.env.NODE_ENV === `production` ? fetchGitHubPosts : getLocalPosts
