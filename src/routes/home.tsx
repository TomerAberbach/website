// eslint-disable-next-line depend/ban-dependencies
import { includeKeys } from 'filter-obj'
import { filter, first, flatMap, get, map, pipe, reduce, toArray } from 'lfi'
import { useId } from 'react'
import { ErrorCrashView } from '~/components/error.tsx'
import GraphWidget from '~/components/graph-widget.tsx'
import { PostSwitcher, useSelectedPostId } from '~/components/post-switcher.tsx'
import {
  createMeta,
  useLoaderData,
  useRouteError,
} from '~/services/deserialize.ts'
import { getGraph } from '~/services/graph.server.ts'
import {
  getMeta,
  SITE_DESCRIPTION,
  SITE_TITLE_AND_AUTHOR,
} from '~/services/meta.ts'
import { getOrderedPosts } from '~/services/ordered.server.ts'
import type { MarkdownPost, Post } from '~/services/post.server.ts'
import { serialize } from '~/services/serialize.server.ts'

const HomePage = () => {
  const { postIds, tags, graph } = useLoaderData<typeof loader>()

  const graphId = useId()
  const [selectedPostId, setSelectedPostId] = useSelectedPostId({
    postIds,
    tags,
    graph,
  })

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-12 md:gap-16'>
      <PostSwitcher
        selectedPostId={selectedPostId}
        setSelectedPostId={setSelectedPostId}
        tags={tags}
        graph={graph}
        graphId={graphId}
      />
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
  const [posts, graph] = await Promise.all([getOrderedPosts(), getGraph()])
  return serialize({
    postIds: new Set(posts.keys()),
    tags: getTags(posts),
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
