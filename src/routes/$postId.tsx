import type { LoaderFunction } from '@remix-run/node'
import { map, pipe, reduce, toArray } from 'lfi'
import { unified } from 'unified'
import { useHydrated } from 'remix-utils'
import rehypeDomParse from 'rehype-dom-parse'
import type { Post } from '../services/posts.server'
import { getPosts } from '../services/posts.server'
import { json, useLoaderData } from '../services/json.js'
import { InternalLink, Link } from '../components/link.js'
import renderHtml from '../services/html.js'
import assert from '../services/assert.js'

const PostPage = () => {
  const { post } = useLoaderData<LoaderData>()
  const { title, tags, timestamp, minutesToRead, content } = post
  const dateTime = new Date(timestamp)

  return (
    <article className='prose mx-auto w-[80ch] max-w-full text-base'>
      <header className='mb-4 space-y-2'>
        <h1 className='m-0 md:m-0'>{title}</h1>
        <p className='space-y-2 whitespace-nowrap text-gray-500'>
          <time dateTime={dateTime.toISOString()}>
            {dateTime.toLocaleDateString(undefined, {
              year: `numeric`,
              month: `long`,
              day: `numeric`,
            })}
          </time>
          <span className='font-medium'> · </span>
          <time dateTime={`${minutesToRead}m`}>{minutesToRead} min read</time>
        </p>
        <ul className='not-prose flex list-none flex-wrap gap-2 !pl-0 text-sm'>
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

const Tag = ({ tag }: { tag: string }) => (
  <InternalLink
    href={`/?tags=${encodeURIComponent(tag)}`}
    className='focus-ring relative block rounded-2xl p-2.5 font-medium leading-none hover:bg-gray-50'
  >
    <div className='absolute left-0 top-0 h-full w-full rounded-2xl border-2 border-gray-300' />
    <span className='text-gray-600'>{tag}</span>
  </InternalLink>
)

const Render = ({ html }: { html: string }) => {
  const hydrated = useHydrated()

  if (!hydrated) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return renderHtml(htmlParser.parse(html), {
    a: ({ ref, href, children, ...props }) => {
      assert(href)
      assert(children)

      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      )
    },
  })
}

const htmlParser = unified().use(rehypeDomParse, { fragment: true }).freeze()

export const loader: LoaderFunction = async ({ params }) => {
  const postId = params.postId!
  const post = (await getPosts()).get(postId)!
  return json({ post })
}

type LoaderData = {
  post: Pick<Post, `title` | `tags` | `timestamp` | `minutesToRead` | `content`>
}

export default PostPage
