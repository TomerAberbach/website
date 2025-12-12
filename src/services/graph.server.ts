import scc from '@rtsao/scc'
import {
  concat,
  filter,
  flatMap,
  forEach,
  get,
  keys,
  map,
  maxWith,
  pipe,
  reduce,
  toArray,
  toGrouped,
  toMap,
  toSet,
  values,
  window,
} from 'lfi'
import createLayout from 'ngraph.forcelayout'
import createGraph from 'ngraph.graph'
import { cache } from './cache.server.ts'
import { getOrderedPosts } from './ordered.server.ts'

export const getGraph = cache(async (): Promise<Graph> => {
  const posts = await getOrderedPosts()
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
  pipe(
    values(posts),
    map(post => vertices.get(post.id) as InternalVertex),
    window(3),
    forEach(([nextVertex, vertex, previousVertex]) => {
      nextVertex!.previous = vertex!.id
      vertex!.next = nextVertex!.id
      vertex!.previous = previousVertex!.id
      previousVertex!.next = vertex!.id
    }),
  )

  const edges = pipe(
    posts,
    flatMap(([fromId, { tags, references }]) =>
      pipe(
        references,
        flatMap(([toId, hrefs]): Iterable<[string, Set<string>]> => {
          const externalVertexIds = pipe(
            hrefs,
            filter(href => vertices.has(href)),
            reduce(toSet()),
          )
          const remainingHrefs = pipe(
            hrefs,
            filter(href => !externalVertexIds.has(href)),
            reduce(toSet()),
          )
          return concat(
            map(id => [id, new Set([id])], externalVertexIds),
            remainingHrefs.size > 0 ? [[toId, remainingHrefs]] : [],
          )
        }),
        map(([toId, hrefs]) => [
          `${fromId} ${toId}`,
          { fromId, toId, tags: new Set(tags), hrefs },
        ]),
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
            hrefToTags: new Map(),
          }),
        )
      }

      for (const tag of tags) {
        vertex.tags.add(tag)
      }

      if (vertex.type === `external`) {
        for (const href of hrefs) {
          let hrefTags = vertex.hrefToTags.get(href)
          if (!hrefTags) {
            vertex.hrefToTags.set(href, (hrefTags = new Set()))
          }

          for (const tag of tags) {
            hrefTags.add(tag)
          }
        }
      }
    }),
  )

  for (const vertex of vertices.values()) {
    if (vertex.type === `external`) {
      vertex.hrefToTags = new Map(
        [...vertex.hrefToTags].sort(([href1], [href2]) =>
          href1.localeCompare(href2),
        ),
      )
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
  previous?: string
  next?: string
  href: string
  reloadDocument: boolean
}

export type ExternalVertex = BaseVertex & {
  type: `external`
  hrefToTags: Map<string, Set<string>>
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
}: Pick<Graph, `vertices` | `edges`>): GraphLayout => {
  const ngraph = createGraph<string, string>()
  for (const id of vertices.keys()) {
    ngraph.addNode(id)
  }
  for (const { fromId, toId } of edges.values()) {
    ngraph.addLink(fromId, toId)
  }

  // Ensure the graph is still compact when there's more than one connected
  // component by an edge between connected components.
  const connectedComponents = findConnectedComponents(edges)
  const layoutOnlyEdges = pipe(
    connectedComponents,
    window(2),
    map(([previousComponent, nextComponent]) =>
      findSimilarInternalVertexPair({
        vertices,
        vertexIds1: previousComponent!,
        vertexIds2: nextComponent!,
      }),
    ),
    reduce(toArray()),
  )
  for (const [fromId, toId] of layoutOnlyEdges) {
    ngraph.addLink(fromId, toId)
  }

  const layout = createLayout(ngraph, {
    theta: 1,
    springLength: SPRING_LENGTH,
    dragCoefficient: 0.2,

    // Decrease this number to spread out the vertices by making them repel each
    // other more.
    gravity: -5.25,
    // Decrease this number to spread out the vertices by allowing the edges to
    // grow more.
    springCoefficient: 0.0045,
  })
  for (let iteration = 0; iteration < 12_500; iteration++) {
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
      map(id => {
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

const findSimilarInternalVertexPair = ({
  vertices,
  vertexIds1,
  vertexIds2,
}: {
  vertices: Graph[`vertices`]
  vertexIds1: Set<string>
  vertexIds2: Set<string>
}): [string, string] =>
  pipe(
    vertexIds1,
    flatMap(id1 =>
      pipe(
        vertexIds2,
        map(id2 => [id1, id2]),
      ),
    ),
    filter(ids => ids.every(id => vertices.get(id)?.type === `internal`)),
    maxWith(([id1, id2]) => {
      const vertex1 = vertices.get(id1)!
      const vertex2 = vertices.get(id2)!
      return vertex1.tags.intersection(vertex2.tags).size
    }),
    get,
  )

const findConnectedComponents = (edges: Graph[`edges`]): Set<string>[] => {
  const graph = pipe(
    values(edges),
    flatMap(({ fromId, toId }) => [
      [fromId, toId],
      [toId, fromId],
    ]),
    reduce(toGrouped(toSet(), toMap())),
  )
  return scc(graph)
}

const SPRING_LENGTH = 30
const SCALE = 10
const PADDING = 150

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
