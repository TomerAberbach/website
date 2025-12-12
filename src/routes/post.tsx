import { invariant } from '@epic-web/invariant'
// eslint-disable-next-line depend/ban-dependencies
import { includeKeys } from 'filter-obj'
import katexStylesPath from 'katex/dist/katex.min.css?url'
import { filter, map, pipe, reduce, toArray, toMap } from 'lfi'
import { useId } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import { isRouteErrorResponse } from 'react-router'
import { findBestMatch } from 'string-similarity'
import { ErrorCrashView, ErrorView } from '~/components/error.tsx'
import { ExternalLink, InternalLink, Link } from '~/components/link.tsx'
import Prose from '~/components/prose.tsx'
import ShrinkWrap from '~/components/shrink-wrap.tsx'
import Tooltip from '~/components/tooltip.tsx'
import arrowRightSvgPath from '~/private/media/arrow-right.svg'
import arrowUpLeftSvgPath from '~/private/media/arrow-up-left.svg'
import arrowUpRightSvgPath from '~/private/media/arrow-up-right.svg'
import arrowUpSvgPath from '~/private/media/arrow-up.svg'
import {
  createMeta,
  useLoaderData,
  useRouteError,
} from '~/services/deserialize.ts'
import {
  formatDateForDisplay,
  formatDateISO,
  formatMinutesToRead,
} from '~/services/format.ts'
import { getMeta } from '~/services/meta.ts'
import { getOrderedMarkdownPosts } from '~/services/ordered.server.ts'
import { getPostKeys } from '~/services/post-keys.server.ts'
import type { PostKey } from '~/services/post-keys.server.ts'
import { getPost } from '~/services/post.server.ts'
import type { Post } from '~/services/post.server.ts'
import { serialize } from '~/services/serialize.server.ts'

const PostPage = () => {
  const suggestEditId = useId()
  const { post } = useLoaderData<typeof loader>()
  const {
    id,
    title,
    tags,
    dates,
    referencedBy,
    minutesToRead,
    html,
    previous: previousPost,
    next: nextPost,
  } = post

  return (
    <article className='prose mx-auto w-[80ch] max-w-full text-base'>
      <header>
        <h1 className='!m-0'>{title}</h1>
        <p className='!m-0 !mt-1.5 !-ml-[1ch] border-l-[1ch] border-white text-gray-600'>
          <span className='mr-[1ch] inline-block whitespace-nowrap'>
            <Dates dates={dates} />
          </span>
          <span className='-ml-[1ch] whitespace-nowrap'>
            <span className='relative -z-10 font-medium'> · </span>
            <span className='inline-flex items-center gap-2'>
              <time dateTime={`${minutesToRead}m`}>
                {formatMinutesToRead(minutesToRead)}
              </time>
              <Tooltip id={suggestEditId} content='Suggest an edit'>
                <ExternalLink
                  className='inline-block size-[1em] hover:ring-3'
                  href={`https://github.com/TomerAberbach/website/edit/main/private/posts/${id}.md`}
                >
                  <span className='not-prose'>
                    <PencilSquareIcon titleId={suggestEditId} />
                  </span>
                </ExternalLink>
              </Tooltip>
            </span>
          </span>
        </p>
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
      <Prose html={html} />
      {(previousPost ?? nextPost) ? (
        <footer className='not-prose mt-8 flex items-center font-medium text-gray-700'>
          {previousPost ? (
            <InternalLink
              href={`/${previousPost.id}`}
              rel='prev'
              className='mr-auto flex max-w-[50%] items-center gap-3 hover:ring-3'
            >
              <img
                src={arrowRightSvgPath}
                alt='Previous'
                className='size-6 -scale-x-100'
              />
              <div className='text-balance'>
                <ShrinkWrap>{previousPost.title}</ShrinkWrap>
              </div>
            </InternalLink>
          ) : null}
          {nextPost ? (
            <InternalLink
              href={`/${nextPost.id}`}
              rel='next'
              className='ml-auto flex max-w-[50%] items-center justify-end gap-3 text-right hover:ring-3'
            >
              <div className='text-balance'>
                <ShrinkWrap>{nextPost.title}</ShrinkWrap>
              </div>
              <img src={arrowRightSvgPath} alt='Next' className='size-6' />
            </InternalLink>
          ) : null}
        </footer>
      ) : null}
      {referencedBy.size > 0 ? (
        <aside className='not-prose m-auto mt-12 flex flex-col items-center text-center'>
          <div className='m-auto inline-flex items-end gap-14'>
            <img src={arrowUpLeftSvgPath} alt='' className='size-6' />
            <img src={arrowUpSvgPath} alt='' className='mb-3 size-6' />
            <img src={arrowUpRightSvgPath} alt='' className='size-6' />
          </div>
          <h3 className='mt-2 text-lg font-semibold'>Linked from</h3>
          <ul className='text-base'>
            {pipe(
              referencedBy,
              map(([reference, title]) => (
                <li key={reference}>
                  <Link href={reference} className='underline'>
                    {title}
                  </Link>
                </li>
              )),
              reduce(toArray()),
            )}
          </ul>
        </aside>
      ) : null}
    </article>
  )
}

const PencilSquareIcon = ({ titleId }: { titleId: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    fill='currentColor'
    className='w-[1em] fill-gray-500'
    aria-labelledby={titleId}
  >
    <path d='M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z' />
    <path d='M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z' />
  </svg>
)

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
    className='relative block rounded-2xl p-2.5 leading-none font-medium hover:bg-gray-50 hover:ring-3'
  >
    <div className='absolute top-0 left-0 size-full rounded-2xl border-2 border-gray-300' />
    <span className='text-gray-600'>{tag}</span>
  </InternalLink>
)

export const ErrorBoundary = () => {
  const error = useRouteError()
  if (!isRouteErrorResponse(error)) {
    return <ErrorCrashView error={error} />
  }

  const { didYouMeanPost } = error.data as ErrorBoundaryData
  return (
    <ErrorView message='404'>
      <p className='prose text-lg italic'>
        Did you mean{` `}
        <InternalLink href={`/${didYouMeanPost.id}`}>
          {didYouMeanPost.title}
        </InternalLink>
        ?
      </p>
    </ErrorView>
  )
}

export const meta = createMeta<typeof loader>(({ location, data }) => [
  ...getMeta(
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
  ...(data?.post.features.has(`math`)
    ? [{ tagName: `link`, rel: `stylesheet`, href: katexStylesPath }]
    : []),
])

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

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const postId = params[`*`]
  invariant(
    postId,
    `Expected a non-empty postId in params: ${JSON.stringify(params)}`,
  )

  const postKeys = pipe(
    await getPostKeys(),
    filter(([, key]) => key.type === `markdown`),
    reduce(toMap()),
  )
  const postKey = postKeys.get(postId)
  if (!postKey) {
    const bestPostMatch = await getPost(findBestPostMatchKey(postId, postKeys))
    throw serialize<ErrorBoundaryData>(
      { didYouMeanPost: includeKeys(bestPostMatch, [`id`, `title`]) },
      { status: 404 },
    )
  }

  const posts = await getOrderedMarkdownPosts()
  const post = posts.get(postId)
  invariant(post, `Expected \`${postId}\` to be a \`markdown\` post.`)

  return serialize({
    post: {
      ...includeKeys(post, [
        `id`,
        `title`,
        `tags`,
        `dates`,
        `referencedBy`,
        `minutesToRead`,
        `html`,
        `description`,
        `features`,
        `previous`,
        `next`,
      ]),
    },
  })
}

const findBestPostMatchKey = (
  id: string,
  keys: Map<string, PostKey>,
): PostKey => {
  const ids = [...keys.keys()]
  const { bestMatchIndex } = findBestMatch(id.toLowerCase(), ids)
  return keys.get(ids[bestMatchIndex]!)!
}

type ErrorBoundaryData = { didYouMeanPost: Pick<Post, `id` | `title`> }

export default PostPage
