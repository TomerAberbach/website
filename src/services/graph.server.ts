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
import { cache } from './cache.server.js'
import { getPosts } from './posts/index.server.js'

export const getGraph = cache(async (): Promise<Graph> => {
  const posts = await getPosts()

  const vertices = pipe(
    posts,
    map(([id, { title, tags, ...rest }]): [string, Vertex] => [
      id,
      {
        id,
        label: title,
        tags,
        href: rest.type === `href` ? rest.href : `/${id}`,
        reloadDocument: rest.type === `href`,
        external: false,
      },
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
  reloadDocument?: boolean
  external: boolean
}

export type Edge = {
  fromId: string
  toId: string
  tags: Set<string>
  hrefs: Set<string>
}

const layoutGraph = ({
  vertices,
  edges,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
}): GraphLayout => {
  const ngraph = createGraph<string, string>()

  for (const id of vertices.keys()) {
    ngraph.addNode(id)
  }

  for (const { fromId, toId } of edges.values()) {
    ngraph.addLink(fromId, toId)
  }

  const layout = createLayout(ngraph, {
    gravity: -1.5,
    theta: 0.8,
    dragCoefficient: 0.02,
    springLength: SPRING_LENGTH,
    // If the vertices overlap, then decrease this number to spread out the
    // vertices by allowing the edges to grow more
    springCoefficient: 0.001,
  })

  // Position internal vertices in a vertical column
  pipe(
    vertices.values(),
    filter(({ external }) => !external),
    index,
    forEach(([index, { id }]) => {
      layout.setNodePosition(
        id,
        // Zig zag internal vertices from left and right in the vertical column
        (index % 2 === 0 ? -1 : 1) * HORIZONTAL_OFFSET,
        index * SPRING_LENGTH,
      )
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

  return {
    boundingBox: {
      width: (maxX - minX) * SCALE + PADDING * 2,
      height: (maxY - minY) * SCALE + PADDING * 2,
    },
    positions: pipe(
      keys(vertices),
      map((id): [string, Position] => {
        const { x, y } = layout.getNodePosition(id)
        return [
          id,
          { x: (x - minX) * SCALE + PADDING, y: (y - minY) * SCALE + PADDING },
        ]
      }),
      reduce(toMap()),
    ),
  }
}

const SPRING_LENGTH = 30
const HORIZONTAL_OFFSET = 10
const SCALE = 10
const PADDING = 50

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
