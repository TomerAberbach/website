import type { LoaderArgs } from '@remix-run/node'
import { map, pipe, reduce, toArray } from 'lfi'
import type { ThrownResponse } from '@remix-run/react'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { useId } from 'react'
import {
  findBestMarkdownPostMatch,
  getMarkdownPosts,
} from '~/services/posts/index.server'
import { createMeta, json, useCatch, useLoaderData } from '~/services/json.js'
import { ExternalLink, InternalLink } from '~/components/link.js'
import Prose from '~/components/prose.js'
import pick from '~/services/pick.js'
import assert from '~/services/assert.js'
import type { Post } from '~/services/posts/types.js'
import Tooltip from '~/components/tooltip.js'
import {
  formatDateForDisplay,
  formatDateISO,
  formatMinutesToRead,
} from '~/services/format.js'
import { getMeta } from '~/services/meta.js'

const PostPage = () => {
  const suggestEditId = useId()
  const { post } = useLoaderData<typeof loader>()
  const { id, title, tags, dates, minutesToRead, content } = post

  return (
    <article className='prose mx-auto w-[80ch] max-w-full text-base'>
      <header>
        <h1 className='m-0'>{title}</h1>
        <div className='mt-1.5 flex items-center gap-2'>
          <p className='m-0 whitespace-nowrap text-gray-500'>
            <Dates dates={dates} />
            <span className='font-medium'> · </span>
            <time dateTime={`${minutesToRead}m`}>
              {formatMinutesToRead(minutesToRead)}
            </time>
          </p>
          <Tooltip id={suggestEditId} content='Suggest an edit'>
            <ExternalLink
              className='inline-block h-[1em] w-[1em] hover:ring'
              href={`https://github.com/TomerAberbach/website/edit/main/private/posts/${id}.md`}
            >
              <PencilSquareIcon
                aria-hidden={undefined}
                className='w-[1em] fill-gray-500'
                titleId={suggestEditId}
              />
            </ExternalLink>
          </Tooltip>
        </div>
        <ul className='not-prose m-0 mt-2 flex list-none flex-wrap gap-2 pl-0 text-sm'>
          {pipe(
            tags,
            map(tag => (
              <li key={tag}>
                <Tag tag={tag} />
              </li>
            )),
            reduce(toArray()),
          )}
        </ul>
      </header>
      <Prose html={content} />
    </article>
  )
}

const Dates = ({ dates: { published, updated } }: { dates: Post[`dates`] }) => {
  const publishedDate = (
    <>
      Published <Date date={published} />
    </>
  )

  if (!updated) {
    return publishedDate
  }

  return (
    <Tooltip content={publishedDate}>
      Updated <Date date={updated} />
    </Tooltip>
  )
}

const Date = ({ date }: { date: Date }) => (
  <time dateTime={formatDateISO(date)}>{formatDateForDisplay(date)}</time>
)

const Tag = ({ tag }: { tag: string }) => (
  <InternalLink
    href={`/?tags=${encodeURIComponent(tag)}`}
    className='relative block rounded-2xl p-2.5 font-medium leading-none hover:bg-gray-50 hover:ring'
  >
    <div className='absolute left-0 top-0 h-full w-full rounded-2xl border-2 border-gray-300' />
    <span className='text-gray-600'>{tag}</span>
  </InternalLink>
)

export const CatchBoundary = () => {
  const {
    data: { didYouMeanPost },
  } = useCatch<ThrownResponse<404, CatchBoundaryData>>()

  return (
    <div className='flex flex-1 flex-col items-center justify-center gap-5 text-center'>
      <h1 className='not-prose text-9xl font-semibold'>404</h1>
      <p className='text-3xl'>
        Oh no! It appears you’ve been{` `}
        <strong>
          <em>bamboozled!</em>
        </strong>
      </p>
      <p className='prose text-lg italic'>
        Did you mean{` `}
        <InternalLink href={`/${didYouMeanPost.id}`}>
          {didYouMeanPost.title}
        </InternalLink>
        ?
      </p>
    </div>
  )
}

export const meta = createMeta<typeof loader>(({ location, data }) =>
  getMeta(
    location,
    data
      ? {
          title: data.post.title,
          description: truncate(data.post.description),
          keywords: data.post.tags,
          post: data.post,
          type: `article`,
        }
      : {
          title: `404`,
          description: `Not found!`,
          type: `website`,
        },
  ),
)

const truncate = (text: string): string => {
  if (text.length <= MAX_LENGTH) {
    return text
  }

  for (let offset = 0; offset < 15; offset++) {
    if (/\s/u.test(text.charAt(MAX_LENGTH - offset))) {
      return `${text.slice(0, Math.max(0, MAX_LENGTH - offset))}…`
    }
  }

  return text.slice(0, Math.max(0, MAX_LENGTH))
}

const MAX_LENGTH = 200

export const loader = async ({ params }: LoaderArgs) => {
  const { postId } = params
  assert(postId, `Expected a non-empty postId in params: ${params}`)

  const post = (await getMarkdownPosts()).get(postId)
  if (!post) {
    throw json<CatchBoundaryData>(
      {
        didYouMeanPost: pick(await findBestMarkdownPostMatch(postId), [
          `id`,
          `title`,
        ]),
      },
      { status: 404 },
    )
  }

  return json({
    post: pick(post, [
      `id`,
      `title`,
      `tags`,
      `dates`,
      `minutesToRead`,
      `content`,
      `description`,
    ]),
  })
}

type CatchBoundaryData = { didYouMeanPost: Pick<Post, `id` | `title`> }

export default PostPage
