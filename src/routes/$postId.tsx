import type { LoaderFunction } from '@remix-run/node'
import { map, pipe, reduce, toArray } from 'lfi'
import type { Post } from '../services/posts.server'
import { getPosts } from '../services/posts.server'
import Render from '../components/render'
import { json, useLoaderData } from '../services/json'
import { InternalLink } from '../components/link.js'

export default function PostPage() {
  const { post } = useLoaderData<LoaderData>()
  const { title, tags, timestamp, minutesToRead, content } = post
  const dateTime = new Date(timestamp)

  return (
    <article className='prose mx-auto w-[80ch] max-w-full px-12 md:prose-lg md:px-16'>
      <header className='mb-4 mt-7 space-y-2'>
        <h1 className='m-0 md:m-0'>{title}</h1>
        <p className='space-y-2 whitespace-nowrap text-slate-500'>
          <time dateTime={dateTime.toISOString()}>
            {dateTime.toLocaleDateString(undefined, {
              year: `numeric`,
              month: `long`,
              day: `numeric`,
            })}
          </time>
          <span> · </span>
          <time dateTime={`${minutesToRead}m`}>{minutesToRead} min read</time>
        </p>
        <ul className='not-prose flex list-none flex-wrap gap-2 !pl-0 text-base'>
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
      <Render html={content} />
    </article>
  )
}

function Tag({ tag }: { tag: string }) {
  return (
    <InternalLink
      href={`/?tags=${encodeURIComponent(tag)}`}
      className='focus-ring relative block rounded-2xl p-2.5 font-medium leading-none hover:bg-slate-50'
    >
      <div className='absolute left-0 top-0 h-full w-full rounded-2xl border-2 border-slate-300' />
      <span className='text-slate-600'>{tag}</span>
    </InternalLink>
  )
}

export const loader: LoaderFunction = async ({ params }) => {
  const postId = params.postId!
  const post = (await getPosts()).get(postId)!
  return json({ post })
}

type LoaderData = {
  post: Pick<Post, `title` | `tags` | `timestamp` | `minutesToRead` | `content`>
}
