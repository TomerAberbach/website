/**
 * How near each vertex of the graph is to the viewer, from 1 for the selected
 * vertex down in steps with the number of edges between them, to a floor for
 * vertices far from it or not connected to it. The page draws a vertex more
 * faintly and further back the lower its altitude, so the selected vertex and
 * its surroundings stand out from the rest of the graph.
 */
export const computeAltitudes = ({
  vertexIds,
  edges,
  selectedVertexId,
}: {
  vertexIds: Iterable<string>
  edges: Iterable<readonly [string, string]>
  selectedVertexId: string
}): Map<string, number> => {
  const neighbors = new Map<string, Set<string>>()
  for (const [fromId, toId] of edges) {
    neighbors.set(fromId, (neighbors.get(fromId) ?? new Set()).add(toId))
    neighbors.set(toId, (neighbors.get(toId) ?? new Set()).add(fromId))
  }

  const hops = new Map<string, number>([[selectedVertexId, 0]])
  const queue = [selectedVertexId]
  while (queue.length > 0) {
    const id = queue.shift()!
    for (const neighborId of neighbors.get(id) ?? []) {
      if (!hops.has(neighborId)) {
        hops.set(neighborId, hops.get(id)! + 1)
        queue.push(neighborId)
      }
    }
  }

  return new Map(
    [...vertexIds].map(id => {
      const distance = hops.get(id)
      return [
        id,
        distance === undefined
          ? FLOOR_ALTITUDE
          : Math.max(FLOOR_ALTITUDE, 1 - distance * ALTITUDE_DROP_PER_HOP),
      ]
    }),
  )
}

/** An edge hangs midway between its endpoints. */
export const getEdgeAltitude = (
  altitudes: Map<string, number>,
  [fromId, toId]: readonly [string, string],
): number => (altitudes.get(fromId)! + altitudes.get(toId)!) / 2

/**
 * The altitude of a vertex or edge that passes the tag filter: near the top,
 * or higher if it already was.
 */
export const MATCHING_ALTITUDE = 0.8

const ALTITUDE_DROP_PER_HOP = 0.25
const FLOOR_ALTITUDE = 0.25
