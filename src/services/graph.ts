import scc from '@rtsao/scc'
import {
  concat,
  filter,
  flatMap,
  forEach,
  map,
  pipe,
  reduce,
  toArray,
  toGrouped,
  toMap,
  toSet,
  values,
  window,
} from 'lfi'
import { cache } from './cache.ts'
import { computeGraphFacts } from './graph-facts.ts'
import type { GraphFact } from './graph-facts.ts'
import { layoutGraph } from './graph-layout.ts'
import type { GraphLayout } from './graph-layout.ts'
import { getOrderedPosts } from './ordered.ts'

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
      },
    ]),
    reduce(toMap()),
  )
  pipe(
    values(posts),
    map(post => vertices.get(post.id) as InternalVertex),
    window(2),
    forEach(([nextVertex, vertex]) => {
      nextVertex!.previous = vertex!.id
      vertex!.next = nextVertex!.id
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
  const facts = computeGraphFacts({ vertices, edges })

  return { vertices, edges, layout, facts }
})

export type Graph = {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
  layout: GraphLayout
  facts: GraphFact[]
}

export type Vertex = InternalVertex | ExternalVertex

export type InternalVertex = BaseVertex & {
  type: `internal`
  previous?: string
  next?: string
  href: string
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

export const findConnectedComponents = (
  edges: Graph[`edges`],
): Set<string>[] => {
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

export type { BoundingBox, GraphLayout, Position } from './graph-layout.ts'
