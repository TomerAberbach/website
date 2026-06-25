import type { GraphFact } from '~/lib/graph-facts.ts'
import type {
  BoundingBox,
  Edge,
  Graph,
  Position,
  Vertex,
} from '~/lib/graph.ts'

// Astro JSON-serializes island props, which silently drops `Map`s and `Set`s,
// so the graph crosses the island boundary as plain arrays-of-entries and is
// rebuilt on the client. (Superjson would round-trip these but bloats the
// client bundle.)

type VertexJson =
  | {
      type: `internal`
      id: string
      label: string
      tags: string[]
      previous?: string
      next?: string
      href: string
    }
  | {
      type: `external`
      id: string
      label: string
      tags: string[]
      hrefToTags: [string, string[]][]
    }

type EdgeJson = {
  fromId: string
  toId: string
  tags: string[]
  hrefs: string[]
}

export type GraphJson = {
  vertices: [string, VertexJson][]
  edges: [string, EdgeJson][]
  layout: { boundingBox: BoundingBox; positions: [string, Position][] }
  facts: GraphFact[]
}

const vertexToJson = (vertex: Vertex): VertexJson =>
  vertex.type === `internal`
    ? { ...vertex, tags: [...vertex.tags] }
    : {
        ...vertex,
        tags: [...vertex.tags],
        hrefToTags: [...vertex.hrefToTags].map(([href, tags]) => [
          href,
          [...tags],
        ]),
      }

const vertexFromJson = (vertex: VertexJson): Vertex =>
  vertex.type === `internal`
    ? { ...vertex, tags: new Set(vertex.tags) }
    : {
        ...vertex,
        tags: new Set(vertex.tags),
        hrefToTags: new Map(
          vertex.hrefToTags.map(([href, tags]) => [href, new Set(tags)]),
        ),
      }

export const graphToJson = (graph: Graph): GraphJson => ({
  vertices: [...graph.vertices].map(([id, vertex]) => [
    id,
    vertexToJson(vertex),
  ]),
  edges: [...graph.edges].map(([id, edge]) => [
    id,
    { ...edge, tags: [...edge.tags], hrefs: [...edge.hrefs] },
  ]),
  layout: {
    boundingBox: graph.layout.boundingBox,
    positions: [...graph.layout.positions],
  },
  facts: graph.facts,
})

export const graphFromJson = (json: GraphJson): Graph => ({
  vertices: new Map(
    json.vertices.map(([id, vertex]) => [id, vertexFromJson(vertex)]),
  ),
  edges: new Map(
    json.edges.map(([id, edge]): [string, Edge] => [
      id,
      { ...edge, tags: new Set(edge.tags), hrefs: new Set(edge.hrefs) },
    ]),
  ),
  layout: {
    boundingBox: json.layout.boundingBox,
    positions: new Map(json.layout.positions),
  },
  facts: json.facts,
})
