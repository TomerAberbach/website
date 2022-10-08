import { basename, join } from 'path'
import fs from 'fs/promises'
import type { ConcurIterable } from 'lfi'
import { asConcur, mapConcur, pipe } from 'lfi'
import { Octokit } from 'octokit'
import assert from '../../assert'

export default function getRawPosts(): Promise<ConcurIterable<RawPost>> {
  return process.env.NODE_ENV === `production`
    ? getGitHubPosts()
    : getLocalPosts()
}

async function getGitHubPosts(): Promise<ConcurIterable<RawPost>> {
  const files = await getGitHubRepositoryDirectory(POSTS_PATH)

  return pipe(
    asConcur(files),
    mapConcur(async ({ type, name, path }) => {
      assert(type === `file`, `Expected ${path} to be a file, but was: ${type}`)

      return {
        id: parseId(name),
        content: getFileContent(await getGitHubRepositoryFile(path)),
      }
    }),
  )
}

async function getGitHubRepositoryDirectory(path: string) {
  const response = await getGitHubRepositoryContents(path)
  const files = response.data

  assert(Array.isArray(files), `Expected ${path} to be a directory`)

  return files
}

async function getGitHubRepositoryFile(path: string) {
  const response = await getGitHubRepositoryContents(path)
  const file = response.data

  assert(
    !Array.isArray(file) && file.type === `file`,
    `Expected ${file} to be a file`,
  )

  return file
}

function getGitHubRepositoryContents(path: string) {
  return new Octokit({ auth: process.env.GITHUB_TOKEN }).request(
    `GET /repos/{owner}/{repo}/contents/{path}`,
    {
      owner: `TomerAberbach`,
      repo: `website`,
      path,
    },
  )
}

function getFileContent({
  encoding,
  content,
}: {
  encoding: string
  content: string
}): string {
  if (encoding !== `base64`) {
    return content
  }

  return Buffer.from(content, `base64`).toString(`utf8`)
}

async function getLocalPosts(): Promise<ConcurIterable<RawPost>> {
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

function parseId(name: string) {
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
