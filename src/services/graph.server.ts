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
import { cache } from './cache.server.ts'
import { getPosts } from './posts/index.server.ts'

export const getGraph = cache(async (): Promise<Graph> => {
  const posts = await getPosts()

  const vertices = pipe(
    posts,
    map(([id, { title, tags, ...rest }]): [string, Vertex] => [
      id,
      {
        type: `internal`,
        id,
        label: title,
        tags,
        href: rest.type === `href` ? rest.href : `/${id}`,
        reloadDocument: rest.type === `href`,
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
        vertices.set(
          toId,
          (vertex = {
            type: `external`,
            id: toId,
            label: toId,
            tags: new Set(),
            hrefs: new Set(),
          }),
        )
      }

      for (const tag of tags) {
        vertex.tags.add(tag)
      }

      if (vertex.type === `external`) {
        for (const href of hrefs) {
          vertex.hrefs.add(href)
        }
      }
    }),
  )

  for (const vertex of vertices.values()) {
    if (vertex.type === `external`) {
      vertex.hrefs = new Set([...vertex.hrefs].sort())
    }
  }

  const layout = layoutGraph({ vertices, edges })

  return { vertices, edges, layout }
})

export type Graph = {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
  layout: GraphLayout
}

export type Vertex = InternalVertex | ExternalVertex

export type InternalVertex = BaseVertex & {
  type: `internal`
  href: string
  reloadDocument: boolean
}

export type ExternalVertex = BaseVertex & {
  type: `external`
  hrefs: Set<string>
}

type BaseVertex = {
  id: string
  label: string
  tags: Set<string>
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
    theta: 1,
    springLength: SPRING_LENGTH,
    dragCoefficient: 0.2,

    // Decrease this number to spread out the vertices by making them repel each
    // other more
    gravity: -5,
    // Decrease this number to spread out the vertices by allowing the edges to
    // grow more
    springCoefficient: 0.005,
  })

  // Position internal vertices in a vertical column
  pipe(
    vertices.values(),
    filter(({ type }) => type === `internal`),
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
const HORIZONTAL_OFFSET = 20
const SCALE = 10
const PADDING = 75

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
