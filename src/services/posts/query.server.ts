import { basename, join } from 'path'
import fs from 'fs/promises'
import type { ConcurIterable } from 'lfi'
import { asConcur, mapConcur, pipe } from 'lfi'
import { Octokit } from 'octokit'
import assert from '../../assert'

export default function queryRawPosts(): Promise<ConcurIterable<RawPost>> {
  return process.env.NODE_ENV === `production`
    ? getGitHubPosts()
    : getLocalPosts()
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

async function getGitHubPosts(): Promise<ConcurIterable<RawPost>> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  const response = await octokit.request(
    `GET /repos/{owner}/{repo}/contents/{path}`,
    {
      owner: `TomerAberbach`,
      repo: `website`,
      path: POSTS_PATH,
    },
  )

  const files = response.data
  assert(Array.isArray(files))

  return pipe(
    asConcur(files),
    mapConcur(({ type, name, content }) => {
      assert(type === `file`)
      assert(content)

      return { id: parseId(name), content }
    }),
  )
}

export type RawPost = { id: string; content: string }

const POSTS_PATH = `src/posts`

function parseId(name: string) {
  assert(name.endsWith(MD_EXTENSION))
  return basename(name, MD_EXTENSION)
}

const MD_EXTENSION = `.md`
