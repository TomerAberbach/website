import { getVertexBox } from './graph-geometry.ts'
import type { Box, Position } from './graph-geometry.ts'
import type { Graph } from './graph.ts'

/**
 * Where along each labeled edge its number goes, as a fraction of the edge
 * from its source. Each label is placed at the candidate point farthest from
 * every other label, from the vertices the edge is not attached to, and from
 * the other edges, with the heaviest edges placed first so they get the
 * clearest spots.
 */
export const placeEdgeLabels = ({
  vertices,
  edges,
  layout: { positions },
}: Pick<Graph, `vertices` | `edges` | `layout`>): Map<string, number> => {
  const boxes = new Map(
    [...vertices].map(([id, vertex]) => [
      id,
      getVertexBox(vertex, positions.get(id)!),
    ]),
  )
  const segments = [...edges.values()].map(({ fromId, toId }) => ({
    fromId,
    toId,
    from: positions.get(fromId)!,
    to: positions.get(toId)!,
  }))
  const labeled = [...edges.values()]
    .filter(({ hrefs }) => hrefs.size > 1)
    .sort((edge1, edge2) => edge2.hrefs.size - edge1.hrefs.size)

  const placed: Position[] = []
  const fractions = new Map<string, number>()
  for (const { fromId, toId } of labeled) {
    const from = positions.get(fromId)!
    const to = positions.get(toId)!
    let best = { fraction: CANDIDATES[0]!, clearance: -Infinity }
    for (const fraction of CANDIDATES) {
      const point = {
        x: from.x + (to.x - from.x) * fraction,
        y: from.y + (to.y - from.y) * fraction,
      }
      let clearance = Infinity
      for (const other of placed) {
        clearance = Math.min(clearance, distance(point, other))
      }
      for (const [id, box] of boxes) {
        if (id !== fromId && id !== toId) {
          clearance = Math.min(clearance, distanceToBox(point, box))
        }
      }
      for (const segment of segments) {
        if (segment.fromId !== fromId || segment.toId !== toId) {
          clearance = Math.min(clearance, distanceToSegment(point, segment))
        }
      }
      if (clearance > best.clearance) {
        best = { fraction, clearance }
      }
    }
    fractions.set(`${fromId} ${toId}`, best.fraction)
    placed.push({
      x: from.x + (to.x - from.x) * best.fraction,
      y: from.y + (to.y - from.y) * best.fraction,
    })
  }
  return fractions
}

const distance = (point1: Position, point2: Position): number =>
  Math.hypot(point1.x - point2.x, point1.y - point2.y)

const distanceToBox = (point: Position, box: Box): number =>
  Math.hypot(
    Math.max(box.left - point.x, 0, point.x - box.right),
    Math.max(box.top - point.y, 0, point.y - box.bottom),
  )

const distanceToSegment = (
  point: Position,
  { from, to }: { from: Position; to: Position },
): number => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const lengthSquared = dx * dx + dy * dy
  const along =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared,
          ),
        )
  return distance(point, { x: from.x + dx * along, y: from.y + dy * along })
}

// The midpoint first, so it wins ties, then spots nearer the ends.
const CANDIDATES = [0.5, 0.4, 0.6, 0.3, 0.7, 0.25, 0.75]
