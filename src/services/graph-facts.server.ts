import {
  count,
  entries,
  filter,
  flatMap,
  forEach,
  get,
  keys,
  map,
  max,
  maxBy,
  min,
  pipe,
  reduce,
  sum,
  toArray,
  toCount,
  toGrouped,
  toMap,
  values,
} from 'lfi'
import plur from 'plur'
import type { ExternalVertex, Graph, Vertex } from './graph.server.ts'
import { findConnectedComponents } from './graph.server.ts'

export type GraphFact = { text: GraphFactSegment[] }
export type GraphFactSegment =
  | string
  | { text: string; href: string }
  | { text: string; vertexId: string }

export const computeGraphFacts = ({
  vertices,
  edges,
}: Pick<Graph, `vertices` | `edges`>): GraphFact[] => {
  const adjacency = buildAdjacencyMap(edges)
  const inDegreeMap = buildInDegreeMap(edges, vertices)
  const outDegreeMap = buildOutDegreeMap(edges, vertices)
  const degreeMap = buildDegreeMap(vertices, inDegreeMap, outDegreeMap)
  const components = findConnectedComponents(edges)

  const facts = [
    orderAndSize(vertices, edges),
    internalVsExternal(vertices),
    highestDegree(vertices, degreeMap),
    highestOutDegree(vertices, outDegreeMap),
    highestInDegree(vertices, inDegreeMap),
    componentCount(components),
    largestComponent(components),
    density(vertices, edges),
    mostPopularTag(vertices),
    tagWithMostCrossings(edges),
    isolatedVertices(degreeMap),
    bidirectionalPairs(edges),
    mostLinkedExternal(vertices, inDegreeMap),
    diameter(components, adjacency),
    averageDegree(degreeMap),
    mostTaggedVertex(vertices),
    radius(components, adjacency, vertices),
    averagePathLength(components, adjacency),
    clusteringCoefficient(adjacency),
    longestTagChain(edges),
    bridgeEdgeCount(edges),
    multiTagEdges(edges),
    tagPairCoOccurrence(vertices),
    externalVertexRatioPerTag(vertices),
  ]

  return facts.filter((fact): fact is GraphFact => fact !== null)
}

const orderAndSize = (
  vertices: Graph[`vertices`],
  edges: Graph[`edges`],
): GraphFact => ({
  text: [
    `The graph has `,
    wiki(`order`, `Order_(graph_theory)`),
    ` ${vertices.size} and `,
    wiki(`size`, `Size_(graph_theory)`),
    ` ${edges.size}.`,
  ],
})

const internalVsExternal = (vertices: Graph[`vertices`]): GraphFact => {
  const internalCount = pipe(
    values(vertices),
    filter(vertex => vertex.type === `internal`),
    count,
  )
  const externalCount = vertices.size - internalCount

  return {
    text: [
      `The graph has ${internalCount} internal and ${externalCount} external `,
      wiki(`vertices`, `Vertex_(graph_theory)`),
      `.`,
    ],
  }
}

const highestDegree = (
  vertices: Graph[`vertices`],
  degreeMap: Map<string, number>,
): GraphFact | null => {
  if (vertices.size === 0) {
    return null
  }

  const [ids, degree] = allMaxBy(degreeMap)
  return {
    text: [
      ...vertexList(ids, vertices),
      ` ${ids.length === 1 ? `has` : `have`} the highest `,
      wiki(`degree`, `Degree_(graph_theory)`),
      ` at ${degree}.`,
    ],
  }
}

const highestOutDegree = (
  vertices: Graph[`vertices`],
  outDegreeMap: Map<string, number>,
): GraphFact | null => {
  if (vertices.size === 0) {
    return null
  }

  const [ids, degree] = allMaxBy(outDegreeMap)
  return {
    text: [
      ...vertexList(ids, vertices),
      ` ${ids.length === 1 ? `has` : `have`} the highest `,
      wiki(`out-degree`, `Out-degree`),
      ` at ${degree}.`,
    ],
  }
}

const highestInDegree = (
  vertices: Graph[`vertices`],
  inDegreeMap: Map<string, number>,
): GraphFact | null => {
  if (vertices.size === 0) {
    return null
  }
  const [ids, degree] = allMaxBy(inDegreeMap)

  return {
    text: [
      ...vertexList(ids, vertices),
      ` ${ids.length === 1 ? `has` : `have`} the highest `,
      wiki(`in-degree`, `In-degree`),
      ` at ${degree}.`,
    ],
  }
}

const componentCount = (components: Set<string>[]): GraphFact => ({
  text: [
    `The graph has ${components.length} `,
    wiki(
      `weakly connected ${plur(`component`, components.length)}`,
      `Weak_component`,
    ),
    `.`,
  ],
})

const largestComponent = (components: Set<string>[]): GraphFact | null => {
  if (components.length === 0) {
    return null
  }

  const largestComponent = pipe(
    components,
    maxBy(component => component.size),
    get,
  )
  return {
    text: [
      `The largest `,
      wiki(`weakly connected component`, `Weak_component`),
      ` has ${largestComponent.size} ${plur(`vertex`, largestComponent.size)}.`,
    ],
  }
}

const density = (
  vertices: Graph[`vertices`],
  edges: Graph[`edges`],
): GraphFact | null => {
  const vertexCount = vertices.size
  if (vertexCount < 2) {
    return null
  }
  const maxEdges = vertexCount * (vertexCount - 1)
  const pct = ((edges.size / maxEdges) * 100).toFixed(1)

  return {
    text: [`The graph `, wiki(`density`, `Dense_graph`), ` is ${pct}%.`],
  }
}

const mostPopularTag = (vertices: Graph[`vertices`]): GraphFact | null => {
  const tagCounts = pipe(
    values(vertices),
    flatMap(vertex => vertex.tags),
    map((tag): [string, string] => [tag, tag]),
    reduce(toGrouped(toCount(), toMap())),
  )

  if (tagCounts.size === 0) {
    return null
  }
  const [tags, tagCount] = allMaxBy(tagCounts)

  return {
    text: [
      `The most popular ${plur(`tag`, tags.length)} ${
        tags.length === 1 ? `is` : `are`
      } `,
      tagList(tags),
      ` with ${tagCount} ${plur(`vertex`, tagCount)}${
        tags.length === 1 ? `` : ` each`
      }.`,
    ],
  }
}

const tagWithMostCrossings = (edges: Graph[`edges`]): GraphFact | null => {
  const tagEdgeCounts = pipe(
    values(edges),
    flatMap(edge => edge.tags),
    map(tag => [tag, tag]),
    reduce(toGrouped(toCount(), toMap())),
  )
  if (tagEdgeCounts.size === 0) {
    return null
  }

  const [tags, edgeCount] = allMaxBy(tagEdgeCounts)
  return {
    text: [
      `The ${plur(`tag`, tags.length)} `,
      tagList(tags),
      ` ${tags.length === 1 ? `has` : `have`} the most `,
      wiki(`edges`, `Edge_(graph_theory)`),
      ` at ${edgeCount}.`,
    ],
  }
}

const isolatedVertices = (degreeMap: Map<string, number>): GraphFact => {
  const isolatedCount = pipe(
    entries(degreeMap),
    filter(([, degree]) => degree === 0),
    count,
  )
  return {
    text: [
      `The graph has ${isolatedCount} `,
      wiki(`isolated ${plur(`vertex`, isolatedCount)}`, `Isolated_vertex`),
      `.`,
    ],
  }
}

const bidirectionalPairs = (edges: Graph[`edges`]): GraphFact => {
  const edgeSet = new Set(edges.keys())
  const biCount = pipe(
    values(edges),
    filter(({ fromId, toId }) => edgeSet.has(`${toId} ${fromId}`)),
    count,
  )
  const pairCount = biCount / 2

  return {
    text: [
      `The graph has ${pairCount} `,
      wiki(`bidirectional`, `Directed_graph`),
      ` edge ${plur(`pair`, pairCount)}.`,
    ],
  }
}

const mostLinkedExternal = (
  vertices: Graph[`vertices`],
  inDegreeMap: Map<string, number>,
): GraphFact | null => {
  const externals = pipe(
    values(vertices),
    filter((vertex): vertex is ExternalVertex => vertex.type === `external`),
    reduce(toArray()),
  )
  if (externals.length === 0) {
    return null
  }

  const externalDegreeMap = new Map(
    externals.map(vertex => [vertex.id, inDegreeMap.get(vertex.id) ?? 0]),
  )
  const [ids, degree] = allMaxBy(externalDegreeMap)

  return {
    text: [
      `The most linked external `,
      wiki(plur(`vertex`, ids.length), `Vertex_(graph_theory)`),
      ` ${ids.length === 1 ? `is` : `are`} `,
      ...vertexList(ids, vertices),
      ` with `,
      wiki(`in-degree`, `In-degree`),
      ` ${degree}.`,
    ],
  }
}

const diameter = (
  components: Set<string>[],
  adjacency: Map<string, Set<string>>,
): GraphFact | null => {
  if (components.length === 0) {
    return null
  }

  const largest = pipe(
    components,
    maxBy(component => component.size),
    get,
  )
  const diameter = computeDiameter(largest, adjacency)

  return {
    text: [
      `The `,
      wiki(`diameter`, `Diameter_(graph_theory)`),
      ` of the largest `,
      wiki(`weakly connected component`, `Weak_component`),
      ` is ${diameter}.`,
    ],
  }
}

const averageDegree = (degreeMap: Map<string, number>): GraphFact | null => {
  if (degreeMap.size === 0) {
    return null
  }

  const average = (pipe(values(degreeMap), sum) / degreeMap.size).toFixed(2)
  return {
    text: [
      `The graph's average `,
      wiki(`degree`, `Degree_(graph_theory)`),
      ` is ${average}.`,
    ],
  }
}

const mostTaggedVertex = (vertices: Graph[`vertices`]): GraphFact | null => {
  if (vertices.size === 0) {
    return null
  }

  const tagCountMap = new Map(
    pipe(
      values(vertices),
      map((vertex): [string, number] => [vertex.id, vertex.tags.size]),
      reduce(toArray()),
    ),
  )
  const [ids, tagCount] = allMaxBy(tagCountMap)

  return {
    text: [
      ...vertexList(ids, vertices),
      ` ${ids.length === 1 ? `has` : `have`} the most tags at ${tagCount}.`,
    ],
  }
}

const radius = (
  components: Set<string>[],
  adjacency: Map<string, Set<string>>,
  vertices: Graph[`vertices`],
): GraphFact | null => {
  if (components.length === 0) {
    return null
  }

  const largest = pipe(
    components,
    maxBy(component => component.size),
    get,
  )
  const eccentricities = new Map<string, number>()
  for (const node of largest) {
    eccentricities.set(node, bfs(node, largest, adjacency))
  }
  const minEcc = pipe(values(eccentricities), min, get)
  const centerIds = pipe(
    entries(eccentricities),
    filter(([, ecc]) => ecc === minEcc),
    map(([id]) => id),
    reduce(toArray()),
  )

  return {
    text: [
      `The `,
      wiki(`radius`, `Radius_(graph_theory)`),
      ` of the largest component is ${minEcc} and its `,
      wiki(`center`, `Graph_center`),
      ` ${centerIds.length === 1 ? `is` : `includes`} `,
      ...vertexList(centerIds, vertices),
      `.`,
    ],
  }
}

const averagePathLength = (
  components: Set<string>[],
  adjacency: Map<string, Set<string>>,
): GraphFact | null => {
  if (components.length === 0) {
    return null
  }

  const largest = pipe(
    components,
    maxBy(component => component.size),
    get,
  )
  let totalDist = 0
  let pairCount = 0
  for (const start of largest) {
    const distances = bfsAllDistances(start, largest, adjacency)
    for (const [node, dist] of distances) {
      if (node !== start) {
        totalDist += dist
        pairCount++
      }
    }
  }
  if (pairCount === 0) {
    return null
  }

  const avg = (totalDist / pairCount).toFixed(2)
  return {
    text: [
      `The `,
      wiki(`average path length`, `Average_path_length`),
      ` in the largest component is ${avg}.`,
    ],
  }
}

const clusteringCoefficient = (
  adjacency: Map<string, Set<string>>,
): GraphFact | null => {
  if (adjacency.size === 0) {
    return null
  }

  let totalCoeff = 0
  for (const [, neighbors] of adjacency) {
    const neighborArr = [...neighbors]
    const k = neighborArr.length
    if (k < 2) {
      continue
    }
    let connectedPairs = 0
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        if (adjacency.get(neighborArr[i]!)?.has(neighborArr[j]!)) {
          connectedPairs++
        }
      }
    }
    totalCoeff += (2 * connectedPairs) / (k * (k - 1))
  }
  const avg = (totalCoeff / adjacency.size).toFixed(3)

  return {
    text: [
      `The average `,
      wiki(`clustering coefficient`, `Clustering_coefficient`),
      ` is ${avg}.`,
    ],
  }
}

const longestTagChain = (edges: Graph[`edges`]): GraphFact | null => {
  const tagEdges = new Map<string, { fromId: string; toId: string }[]>()
  for (const edge of edges.values()) {
    for (const tag of edge.tags) {
      if (!tagEdges.has(tag)) {
        tagEdges.set(tag, [])
      }
      tagEdges.get(tag)!.push({ fromId: edge.fromId, toId: edge.toId })
    }
  }
  if (tagEdges.size === 0) {
    return null
  }

  let bestTag = ``
  let bestLength = 0
  for (const [tag, edgeList] of tagEdges) {
    const subAdj = new Map<string, Set<string>>()
    const subVertices = new Set<string>()
    for (const { fromId, toId } of edgeList) {
      subVertices.add(fromId)
      subVertices.add(toId)
      if (!subAdj.has(fromId)) {
        subAdj.set(fromId, new Set())
      }
      if (!subAdj.has(toId)) {
        subAdj.set(toId, new Set())
      }
      subAdj.get(fromId)!.add(toId)
      subAdj.get(toId)!.add(fromId)
    }
    for (const vertex of subVertices) {
      const dist = bfs(vertex, subVertices, subAdj)
      if (dist > bestLength) {
        bestLength = dist
        bestTag = tag
      }
    }
  }
  if (bestLength === 0) {
    return null
  }

  return {
    text: [
      `The tag with the longest chain is `,
      tagList([bestTag]),
      ` at ${bestLength} ${plur(`edge`, bestLength)}.`,
    ],
  }
}

const bridgeEdgeCount = (edges: Graph[`edges`]): GraphFact | null => {
  const bridges = findBridges(edges)

  return {
    text: [
      `The graph has ${bridges} `,
      wiki(`bridge ${plur(`edge`, bridges)}`, `Bridge_(graph_theory)`),
      `.`,
    ],
  }
}

const findBridges = (edges: Graph[`edges`]): number => {
  const adj = new Map<string, Set<string>>()
  for (const { fromId, toId } of edges.values()) {
    if (!adj.has(fromId)) {
      adj.set(fromId, new Set())
    }
    if (!adj.has(toId)) {
      adj.set(toId, new Set())
    }
    adj.get(fromId)!.add(toId)
    adj.get(toId)!.add(fromId)
  }

  const disc = new Map<string, number>()
  const low = new Map<string, number>()
  let timer = 0
  let bridgeCount = 0

  const dfs = (node: string, parent: string | null) => {
    disc.set(node, timer)
    low.set(node, timer)
    timer++

    for (const neighbor of adj.get(node) ?? []) {
      if (!disc.has(neighbor)) {
        dfs(neighbor, node)
        low.set(node, Math.min(low.get(node)!, low.get(neighbor)!))
        if (low.get(neighbor)! > disc.get(node)!) {
          bridgeCount++
        }
      } else if (neighbor !== parent) {
        low.set(node, Math.min(low.get(node)!, disc.get(neighbor)!))
      }
    }
  }

  for (const node of adj.keys()) {
    if (!disc.has(node)) {
      dfs(node, null)
    }
  }
  return bridgeCount
}

const multiTagEdges = (edges: Graph[`edges`]): GraphFact => {
  const multiCount = pipe(
    values(edges),
    filter(edge => edge.tags.size > 1),
    count,
  )
  return {
    text: [
      `${multiCount} ${plur(`edge`, multiCount)} ${multiCount === 1 ? `carries` : `carry`} more than one tag.`,
    ],
  }
}

const tagPairCoOccurrence = (vertices: Graph[`vertices`]): GraphFact | null => {
  const pairCounts = new Map<string, number>()
  for (const vertex of vertices.values()) {
    const tags = [...vertex.tags].sort()
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const key = `${tags[i]}\0${tags[j]}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }
  if (pairCounts.size === 0) {
    return null
  }

  const [keys_, maxCount] = allMaxBy(pairCounts)
  const [tagA, tagB] = keys_[0]!.split(`\0`)

  return {
    text: [
      `The most common tag pair is `,
      tagList([tagA!, tagB!], `and`),
      `, appearing together on ${maxCount} ${plur(`vertex`, maxCount)}.`,
    ],
  }
}

const externalVertexRatioPerTag = (
  vertices: Graph[`vertices`],
): GraphFact | null => {
  const tagTotal = new Map<string, number>()
  const tagExternal = new Map<string, number>()
  for (const vertex of vertices.values()) {
    for (const tag of vertex.tags) {
      tagTotal.set(tag, (tagTotal.get(tag) ?? 0) + 1)
      if (vertex.type === `external`) {
        tagExternal.set(tag, (tagExternal.get(tag) ?? 0) + 1)
      }
    }
  }

  let bestTag = ``
  let bestRatio = -1
  for (const [tag, total] of tagTotal) {
    if (total < 2) {
      continue
    }
    const ratio = (tagExternal.get(tag) ?? 0) / total
    if (ratio > bestRatio) {
      bestRatio = ratio
      bestTag = tag
    }
  }
  if (bestRatio < 0) {
    return null
  }

  const pct = (bestRatio * 100).toFixed(0)
  return {
    text: [
      `The tag `,
      tagList([bestTag]),
      ` has the highest external vertex ratio at ${pct}%.`,
    ],
  }
}

const bfsAllDistances = (
  start: string,
  component: Set<string>,
  adjacency: Map<string, Set<string>>,
): Map<string, number> => {
  const distances = new Map<string, number>([[start, 0]])
  let frontier = [start]
  let dist = 0

  while (frontier.length > 0) {
    const nextFrontier: string[] = []
    dist++
    for (const node of frontier) {
      for (const neighbor of adjacency.get(node) ?? []) {
        if (!distances.has(neighbor) && component.has(neighbor)) {
          distances.set(neighbor, dist)
          nextFrontier.push(neighbor)
        }
      }
    }
    frontier = nextFrontier
  }

  return distances
}

const computeDiameter = (
  component: Set<string>,
  adjacency: Map<string, Set<string>>,
): number => {
  let maxDist = 0
  for (const start of component) {
    const dist = bfs(start, component, adjacency)
    if (dist > maxDist) {
      maxDist = dist
    }
  }
  return maxDist
}

const bfs = (
  start: string,
  component: Set<string>,
  adjacency: Map<string, Set<string>>,
): number => {
  const visited = new Set([start])
  let frontier = [start]
  let dist = 0

  while (frontier.length > 0) {
    const nextFrontier: string[] = []
    for (const node of frontier) {
      const neighbors = adjacency.get(node)
      if (!neighbors) {
        continue
      }
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && component.has(neighbor)) {
          visited.add(neighbor)
          nextFrontier.push(neighbor)
        }
      }
    }
    if (nextFrontier.length > 0) {
      dist++
    }
    frontier = nextFrontier
  }

  return dist
}

const buildAdjacencyMap = (edges: Graph[`edges`]): Map<string, Set<string>> => {
  const adj = new Map<string, Set<string>>()
  pipe(
    values(edges),
    forEach(({ fromId, toId }) => {
      if (!adj.has(fromId)) {
        adj.set(fromId, new Set())
      }
      if (!adj.has(toId)) {
        adj.set(toId, new Set())
      }
      adj.get(fromId)!.add(toId)
      adj.get(toId)!.add(fromId)
    }),
  )
  return adj
}

const buildInDegreeMap = (
  edges: Graph[`edges`],
  vertices: Graph[`vertices`],
): Map<string, number> => {
  const degMap = pipe(
    keys(vertices),
    map((id): [string, number] => [id, 0]),
    reduce(toMap()),
  )
  pipe(
    values(edges),
    forEach(({ toId }) => {
      degMap.set(toId, (degMap.get(toId) ?? 0) + 1)
    }),
  )
  return degMap
}

const buildOutDegreeMap = (
  edges: Graph[`edges`],
  vertices: Graph[`vertices`],
): Map<string, number> => {
  const degMap = pipe(
    keys(vertices),
    map((id): [string, number] => [id, 0]),
    reduce(toMap()),
  )
  pipe(
    values(edges),
    forEach(({ fromId }) => {
      degMap.set(fromId, (degMap.get(fromId) ?? 0) + 1)
    }),
  )
  return degMap
}

const buildDegreeMap = (
  vertices: Graph[`vertices`],
  inDegreeMap: Map<string, number>,
  outDegreeMap: Map<string, number>,
): Map<string, number> =>
  pipe(
    keys(vertices),
    map((id): [string, number] => [
      id,
      (inDegreeMap.get(id) ?? 0) + (outDegreeMap.get(id) ?? 0),
    ]),
    reduce(toMap()),
  )

const allMaxBy = (map_: Map<string, number>): [string[], number] => {
  const maxVal = pipe(values(map_), max, get)
  const ids = pipe(
    entries(map_),
    filter(([, val]) => val === maxVal),
    map(([key]) => key),
    reduce(toArray()),
  )
  return [ids, maxVal]
}

const listFormat = new Intl.ListFormat(`en`, {
  style: `long`,
  type: `conjunction`,
})

const vertexList = (
  ids: string[],
  vertices: Graph[`vertices`],
): GraphFactSegment[] =>
  listFormat
    .formatToParts(ids)
    .map(({ type, value }) =>
      type === `element` ? vertexLink(vertices.get(value)!) : value,
    )

const tagList = (tags: string[], op?: `and`): GraphFactSegment => ({
  text: listFormat.format(tags),
  href: `/?tags=${tags.map(encodeURIComponent).join(`,`)}${op ? `&op=${op}` : ``}`,
})

const wiki = (text: string, article: string): GraphFactSegment => ({
  text,
  href: `https://en.wikipedia.org/wiki/${article}`,
})

const vertexLink = (vertex: Vertex): GraphFactSegment => ({
  text: vertex.label,
  vertexId: vertex.id,
})
