import type { LoaderFunction } from '@remix-run/node'
import { useId } from 'react'
import { first, get, pipe, values } from 'lfi'
import { getMarkdownPosts, getTags } from '~/services/posts/index.server'
import { createMeta, json, useLoaderData } from '~/services/json.js'
import { getGraph } from '~/services/graph.server'
import type { Graph } from '~/services/graph.server'
import { TagsFilterForm } from '~/components/tags-filter-form.js'
import GraphWidget from '~/components/graph-widget.js'
import pick from '~/services/pick.js'
import type { MarkdownPost } from '~/services/posts/types.js'
import { getMeta } from '~/services/meta.js'

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

export const meta = createMeta<LoaderData>(({ location, data }) =>
  getMeta(location, {
    title: `Home`,
    description: `The portfolio website and blog of Tomer Aberbach, a New Jersey based software engineer, composer, and music producer.`,
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
