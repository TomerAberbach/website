import type {
  Edge,
  ExternalVertex,
  Graph,
  InternalVertex,
} from '~/services/graph.ts'

/**
 * Builds a graph whose internal vertices are chained in the given order, with
 * every vertex positioned on a diagonal of a square bounding box.
 */
export const createGraph = ({
  posts,
  externals = [],
  edges = [],
}: {
  posts: { id: string; tags?: string[]; href?: string }[]
  externals?: { id: string; hrefs: string[]; tags?: string[] }[]
  edges?: { fromId: string; toId: string; hrefs: string[]; tags?: string[] }[]
}): Graph => {
  const vertices = new Map<string, InternalVertex | ExternalVertex>()
  for (const [index, { id, tags = [], href }] of posts.entries()) {
    vertices.set(id, {
      type: `internal`,
      id,
      label: `Post ${id}`,
      tags: new Set(tags),
      href: href ?? `/${id}`,
      previous: posts[index + 1]?.id,
      next: posts[index - 1]?.id,
    })
  }
  for (const { id, hrefs, tags = [] } of externals) {
    vertices.set(id, {
      type: `external`,
      id,
      label: id,
      tags: new Set(tags),
      hrefToTags: new Map(hrefs.map(href => [href, new Set(tags)])),
    })
  }

  const positions = new Map(
    [...vertices.keys()].map((id, index) => [
      id,
      { x: 100 + index * 200, y: 100 + index * 200 },
    ]),
  )
  const size = 200 * vertices.size

  return {
    vertices,
    edges: new Map(
      edges.map(({ fromId, toId, hrefs, tags = [] }): [string, Edge] => [
        `${fromId} ${toId}`,
        { fromId, toId, hrefs: new Set(hrefs), tags: new Set(tags) },
      ]),
    ),
    layout: { boundingBox: { width: size, height: size }, positions },
    facts: [],
  }
}
