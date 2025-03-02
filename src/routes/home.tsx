import { useId } from 'react'
import { filter, first, flatMap, get, map, pipe, reduce, toArray } from 'lfi'
import { includeKeys } from 'filter-obj'
import {
  createMeta,
  useLoaderData,
  useRouteError,
} from '~/services/deserialize'
import { serialize } from '~/services/serialize.server'
import { getGraph } from '~/services/graph.server.ts'
import { TagsFilterForm } from '~/components/tags-filter-form.tsx'
import GraphWidget from '~/components/graph-widget.tsx'
import {
  SITE_DESCRIPTION,
  SITE_TITLE_AND_AUTHOR,
  getMeta,
} from '~/services/meta.ts'
import { ErrorCrashView } from '~/components/error.tsx'
import { getOrderedPosts } from '~/services/ordered.server'
import type { MarkdownPost, Post } from '~/services/post.server'
import { PostSwitcher, useSelectedPostId } from '~/components/post-switcher'

const HomePage = () => {
  const { postIds, tags, graph } = useLoaderData<typeof loader>()

  const graphId = useId()
  const [selectedPostId, setSelectedPostId] = useSelectedPostId(postIds)

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-12 md:gap-16'>
      <div className='flex flex-col gap-10 sm:gap-14 md:gap-18'>
        <TagsFilterForm targetId={graphId} tags={tags} />
        <PostSwitcher
          selectedPostId={selectedPostId}
          setSelectedPostId={setSelectedPostId}
          graph={graph}
        />
      </div>
      <GraphWidget
        id={graphId}
        graph={graph}
        selectedVertexId={selectedPostId}
      />
    </div>
  )
}

export const ErrorBoundary = () => <ErrorCrashView error={useRouteError()} />

export const meta = createMeta<typeof loader>(({ location, data }) =>
  getMeta(location, {
    title: SITE_TITLE_AND_AUTHOR,
    description: SITE_DESCRIPTION,
    post: data?.latestPost,
    type: `website`,
  }),
)

export const loader = async () => {
  const posts = await getOrderedPosts()
  const [tags, graph] = await Promise.all([getTags(posts), getGraph(posts)])
  return serialize({
    postIds: new Set(posts.keys()),
    tags,
    graph,
    latestPost: includeKeys(getLatestMarkdownPost(posts), [
      `id`,
      `title`,
      `tags`,
      `dates`,
      `minutesToRead`,
    ]),
  })
}

const getTags = (posts: Map<string, Post>) =>
  new Set(
    pipe(
      posts,
      flatMap(([, { tags }]) => tags),
      reduce(toArray()),
    ).sort(),
  )

const getLatestMarkdownPost = (posts: Map<string, Post>): MarkdownPost =>
  pipe(
    posts,
    map(([, post]) => post),
    filter(post => post.type === `markdown`),
    first,
    get,
  )

export const shouldRevalidate = () => false

export default HomePage
