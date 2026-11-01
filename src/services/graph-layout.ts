import { map, pipe, reduce, toArray, toGrouped, toMap } from 'lfi'
import { getDirectionAwayFrom, layoutCore } from './graph-core-layout.ts'
import { getVertexBox, measureFan, placeFan } from './graph-geometry.ts'
import type { Box, Position } from './graph-geometry.ts'
import type { Edge, Vertex } from './graph.ts'

/**
 * Lays out the graph in pixels, with each vertex's label box free of overlaps.
 *
 * The graph is a small core of posts and shared sites with large fans of sites
 * that a single post links to. The core is positioned by minimizing an energy
 * that reserves room for each fan, each fan is then placed in the widest angle
 * its post has free, and a final pass pushes apart any label boxes that still
 * overlap.
 */
export const layoutGraph = ({
  vertices,
  edges,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
}): GraphLayout => {
  const { core, leaves } = partitionVertices({ vertices, edges })
  const positions = layoutCore({ vertices, edges, core, leaves })
  placeLeaves({ vertices, edges, core, leaves, positions })

  const getBoxes = () =>
    new Map(
      pipe(
        positions,
        map(([id, position]): [string, Box] => [
          id,
          getVertexBox(vertices.get(id)!, position),
        ]),
      ),
    )

  // A post and its fan move as a unit first, so that the fans the core layout
  // left touching come apart intact, and only stragglers are nudged by the
  // pass over individual labels.
  const groups = groupFans({ core, leaves, boxes: getBoxes() })
  removeOverlaps({ boxes: groups, mobility: () => 1 })
  for (const [parentId, group] of groups) {
    const { x, y } = positions.get(parentId)!
    const dx = group.x - x
    const dy = group.y - y
    for (const id of [parentId, ...group.memberIds]) {
      const position = positions.get(id)!
      positions.set(id, { x: position.x + dx, y: position.y + dy })
    }
  }

  const boxes = getBoxes()
  removeOverlaps({
    boxes,
    mobility: id => (core.has(id) ? CORE_MOBILITY : 1),
  })

  return fitBoundingBox(boxes)
}

/** One box per core vertex covering it and its leaves. */
const groupFans = ({
  core,
  leaves,
  boxes,
}: {
  core: Set<string>
  leaves: Map<string, string>
  boxes: Map<string, Box>
}): Map<string, GroupBox> => {
  const groups = new Map<string, GroupBox>(
    pipe(
      core,
      map((id): [string, GroupBox] => [
        id,
        { ...boxes.get(id)!, memberIds: [] },
      ]),
    ),
  )
  for (const [leafId, parentId] of leaves) {
    const group = groups.get(parentId)!
    const box = boxes.get(leafId)!
    group.memberIds.push(leafId)
    group.left = Math.min(group.left, box.left)
    group.right = Math.max(group.right, box.right)
    group.top = Math.min(group.top, box.top)
    group.bottom = Math.max(group.bottom, box.bottom)
  }
  return groups
}

type GroupBox = Box & { memberIds: string[] }

/**
 * Splits the vertices into the core, which the energy layout positions, and
 * the leaves, which are the external vertices linked from a single post, keyed
 * by that post.
 */
const partitionVertices = ({
  vertices,
  edges,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
}): { core: Set<string>; leaves: Map<string, string> } => {
  const degrees = new Map<string, number>()
  const parents = new Map<string, string>()
  for (const { fromId, toId } of edges.values()) {
    degrees.set(fromId, (degrees.get(fromId) ?? 0) + 1)
    degrees.set(toId, (degrees.get(toId) ?? 0) + 1)
    parents.set(toId, fromId)
  }

  const core = new Set<string>()
  const leaves = new Map<string, string>()
  for (const [id, vertex] of vertices) {
    if (vertex.type === `external` && degrees.get(id) === 1) {
      leaves.set(id, parents.get(id)!)
    } else {
      core.add(id)
    }
  }
  return { core, leaves }
}

/**
 * Places each post's leaves in the sector the core layout reserved for them:
 * pointing away from the post's neighbors and as wide as the fan's estimate.
 */
const placeLeaves = ({
  vertices,
  edges,
  core,
  leaves,
  positions,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
  core: Set<string>
  leaves: Map<string, string>
  positions: Map<string, Position>
}): void => {
  const fans = pipe(
    leaves,
    map(([leafId, parentId]) => [parentId, leafId]),
    reduce(toGrouped(toArray(), toMap())),
  )
  const neighbors = new Map<string, Set<string>>()
  for (const { fromId, toId } of edges.values()) {
    if (core.has(fromId) && core.has(toId)) {
      neighbors.set(fromId, new Set(neighbors.get(fromId)).add(toId))
      neighbors.set(toId, new Set(neighbors.get(toId)).add(fromId))
    }
  }

  for (const [parentId, leafIds] of fans) {
    const parent = positions.get(parentId)!
    const direction = getDirectionAwayFrom(
      parent,
      [...(neighbors.get(parentId) ?? [])].map(id => positions.get(id)!),
    )
    const { span } = measureFan(leafIds.map(id => vertices.get(id)!))
    const offsets = placeFan({ vertices, leafIds, direction, span })
    for (const [leafId, offset] of offsets) {
      positions.set(leafId, { x: parent.x + offset.x, y: parent.y + offset.y })
    }
  }
}

/**
 * Pushes overlapping boxes apart until none overlap. Each pair's displacement
 * is split in proportion to the boxes' mobility.
 */
const removeOverlaps = ({
  boxes,
  mobility,
}: {
  boxes: Map<string, Box>
  mobility: (id: string) => number
}): void => {
  const entries = [...boxes]
  for (let iteration = 0; iteration < MAX_OVERLAP_ITERATIONS; iteration++) {
    let moved = false
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const [id1, box1] = entries[i]!
        const [id2, box2] = entries[j]!
        const overlapX =
          Math.min(box1.right, box2.right) - Math.max(box1.left, box2.left)
        const overlapY =
          Math.min(box1.bottom, box2.bottom) - Math.max(box1.top, box2.top)
        if (overlapX <= 0 || overlapY <= 0) {
          continue
        }

        moved = true
        const pushX = overlapX + OVERLAP_MARGIN
        const pushY = overlapY + OVERLAP_MARGIN
        const mobility1 = mobility(id1)
        const mobility2 = mobility(id2)
        const weight1 = mobility1 / (mobility1 + mobility2)
        const weight2 = 1 - weight1
        if (overlapX < overlapY) {
          const direction = Math.sign(box1.x - box2.x) || 1
          translateBox(box1, direction * pushX * weight1, 0)
          translateBox(box2, -direction * pushX * weight2, 0)
        } else {
          const direction = Math.sign(box1.y - box2.y) || 1
          translateBox(box1, 0, direction * pushY * weight1)
          translateBox(box2, 0, -direction * pushY * weight2)
        }
      }
    }
    if (!moved) {
      return
    }
  }
}

const translateBox = (box: Box, dx: number, dy: number): void => {
  box.x += dx
  box.y += dy
  box.left += dx
  box.right += dx
  box.top += dy
  box.bottom += dy
}

/** Shifts the boxes so that they sit inside a padded bounding box. */
const fitBoundingBox = (boxes: Map<string, Box>): GraphLayout => {
  const minX = Math.min(...boxes.values().map(box => box.left))
  const minY = Math.min(...boxes.values().map(box => box.top))
  const maxX = Math.max(...boxes.values().map(box => box.right))
  const maxY = Math.max(...boxes.values().map(box => box.bottom))
  return {
    boundingBox: {
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2,
    },
    positions: new Map(
      pipe(
        boxes,
        map(([id, { x, y }]): [string, Position] => [
          id,
          { x: x - minX + PADDING, y: y - minY + PADDING },
        ]),
      ),
    ),
  }
}

export { getVertexBox } from './graph-geometry.ts'
export type { Box, Position } from './graph-geometry.ts'

export type GraphLayout = {
  boundingBox: BoundingBox
  positions: Map<string, Position>
}

export type BoundingBox = {
  width: number
  height: number
}

const PADDING = 50
// The core keeps the shape the energy layout gave it, so leaves move to
// resolve what overlaps remain.
const CORE_MOBILITY = 0.1
const OVERLAP_MARGIN = 1
const MAX_OVERLAP_ITERATIONS = 500
