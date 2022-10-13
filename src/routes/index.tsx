import type { LoaderFunction } from '@remix-run/node'
import GraphWidget from '../components/graph'
import type { Graph } from '../services/graph.server'
import { getGraph } from '../services/graph.server'
import { json, useLoaderData } from '../services/json'
import { getTags } from '../services/posts.server'

export default function HomePage() {
  const { tags, graph } = useLoaderData<LoaderData>()

  return <GraphWidget tags={tags} graph={graph} />
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
