import {
  filter,
  flatMap,
  forEach,
  index,
  keys,
  map,
  pipe,
  reduce,
  toArray,
  toMap,
  values,
} from 'lfi'
import createLayout from 'ngraph.forcelayout'
import createGraph from 'ngraph.graph'
import { cached } from './cache.server.js'
import { getPosts } from './posts.server.js'

export const getGraph = cached(async (): Promise<Graph> => {
  const posts = await getPosts()

  const vertices = pipe(
    posts,
    map(([id, { title, tags }]): [string, Vertex] => [
      id,
      { id, label: title, tags, href: `/${id}`, external: false },
    ]),
    reduce(toMap()),
  )
  const edges = pipe(
    posts,
    flatMap(([fromId, { tags, references }]) =>
      map(
        ([toId, hrefs]): [string, Edge] => [
          `${fromId} ${toId}`,
          { fromId, toId, tags: new Set(tags), hrefs },
        ],
        references,
      ),
    ),
    reduce(toMap()),
  )
  pipe(
    values(edges),
    filter(({ toId }) => !vertices.has(toId)),
    reduce(toArray()),
    forEach(({ toId, tags, hrefs }) => {
      let vertex = vertices.get(toId)

      if (!vertex) {
        const url = new URL(hrefs.values().next().value)
        vertices.set(
          toId,
          (vertex = {
            id: toId,
            label: toId,
            tags: new Set(),
            href: url.origin,
            external: true,
          }),
        )
      }

      for (const tag of tags) {
        vertex.tags.add(tag)
      }
    }),
  )

  const layout = layoutGraph({ vertices, edges })

  return { vertices, edges, layout }
})

export type Graph = {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
  layout: GraphLayout
}

export type Vertex = {
  id: string
  label: string
  tags: Set<string>
  href: string
  external: boolean
}

export type Edge = {
  fromId: string
  toId: string
  tags: Set<string>
  hrefs: Set<string>
}

function layoutGraph({
  vertices,
  edges,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
}): GraphLayout {
  const ngraph = createGraph<string, string>()

  for (const id of vertices.keys()) {
    ngraph.addNode(id)
  }

  for (const { fromId, toId } of edges.values()) {
    ngraph.addLink(fromId, toId)
  }

  const springLength = 30
  const layout = createLayout(ngraph, {
    springLength,
    springCoefficient: 0.02,
    gravity: -0.5,
    theta: 0.8,
    dragCoefficient: 0.02,
  })

  pipe(
    vertices.values(),
    filter(({ external }) => !external),
    index,
    forEach(([index, { id }]) => {
      layout.setNodePosition(id, 0, index * springLength)
      layout.pinNode(ngraph.getNode(id)!, true)
    }),
  )

  for (let iteration = 0; iteration < 1_000_000; iteration++) {
    layout.step()
  }

  const {
    min_x: minX,
    min_y: minY,
    max_x: maxX,
    max_y: maxY,
  } = layout.simulator.getBoundingBox()

  const scale = 10
  const padding = 50
  return {
    boundingBox: {
      width: (maxX - minX) * scale + padding * 2,
      height: (maxY - minY) * scale + padding * 2,
    },
    positions: pipe(
      keys(vertices),
      map((id): [string, Position] => {
        const { x, y } = layout.getNodePosition(id)
        return [
          id,
          { x: (x - minX) * scale + padding, y: (y - minY) * scale + padding },
        ]
      }),
      reduce(toMap()),
    ),
  }
}

export type GraphLayout = {
  boundingBox: BoundingBox
  positions: Map<string, Position>
}

export type BoundingBox = {
  width: number
  height: number
}

export type Position = {
  x: number
  y: number
}
