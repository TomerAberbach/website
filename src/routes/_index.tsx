import type { LoaderFunction } from '@remix-run/node'
import { useId } from 'react'
import { first, get, pipe, values } from 'lfi'
import { getMarkdownPosts, getTags } from '~/services/posts/index.server.ts'
import {
  createMeta,
  json,
  useLoaderData,
  useRouteError,
} from '~/services/json.ts'
import { getGraph } from '~/services/graph.server.ts'
import type { Graph } from '~/services/graph.server.ts'
import { TagsFilterForm } from '~/components/tags-filter-form.tsx'
import GraphWidget from '~/components/graph-widget.tsx'
import pick from '~/services/pick.ts'
import type { MarkdownPost } from '~/services/posts/types.ts'
import { SITE_DESCRIPTION, getMeta } from '~/services/meta.ts'
import { ErrorCrashView } from '~/components/error.tsx'

const HomePage = () => {
  const { tags, graph } = useLoaderData<LoaderData>()
  const graphId = useId()

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-y-12 md:gap-y-20'>
      <TagsFilterForm targetId={graphId} tags={tags} />
      <GraphWidget id={graphId} graph={graph} />
    </div>
  )
}

export const ErrorBoundary = () => <ErrorCrashView error={useRouteError()} />

export const meta = createMeta<LoaderData>(({ location, data }) =>
  getMeta(location, {
    title: `Home`,
    description: SITE_DESCRIPTION,
    post: data?.latestPost,
    type: `website`,
  }),
)

export const loader: LoaderFunction = async () => {
  const [tags, graph, latestPost] = await Promise.all([
    getTags(),
    getGraph(),
    getLatestMarkdownPost(),
  ])
  return json<LoaderData>({
    tags,
    graph,
    latestPost: pick(latestPost, [
      `id`,
      `title`,
      `tags`,
      `dates`,
      `minutesToRead`,
    ]),
  })
}

const getLatestMarkdownPost = async () =>
  pipe(await getMarkdownPosts(), values, first, get)

type LoaderData = {
  tags: Set<string>
  graph: Graph
  latestPost: Pick<
    MarkdownPost,
    `id` | `title` | `tags` | `dates` | `minutesToRead`
  >
}

export const shouldRevalidate = () => false

export default HomePage
