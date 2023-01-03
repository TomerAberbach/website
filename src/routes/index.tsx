import type { LoaderFunction } from '@remix-run/node'
import { useId } from 'react'
import { getTags } from '../services/posts/index.server'
import { json, useLoaderData } from '../services/json.js'
import { getGraph } from '../services/graph.server'
import type { Graph } from '../services/graph.server'
import { TagsFilterForm } from '../components/tags-filter-form.js'
import GraphWidget from '../components/graph-widget.js'

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

export const loader: LoaderFunction = async () =>
  json<LoaderData>({
    tags: await getTags(),
    graph: await getGraph(),
  })

type LoaderData = {
  tags: Set<string>
  graph: Graph
}

// eslint-disable-next-line camelcase
export const unstable_shouldReload = () => false

export default HomePage
