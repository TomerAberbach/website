import scc from '@rtsao/scc'
import { filter, flatMap, get, map, maxWith, pipe } from 'lfi'
import { getVertexBox, measureFan, placeFan } from './graph-geometry.ts'
import type { FanSize, Position } from './graph-geometry.ts'
import type { Edge, Vertex } from './graph.ts'

/**
 * Positions the core of the graph, the posts and the sites shared between
 * posts, by minimizing an energy that states what the drawing needs:
 *
 * - vertices are as far apart as their distance in the graph, so related
 *   vertices are near each other and unrelated ones are not;
 * - label boxes do not overlap;
 * - an edge keeps clear of every label it is not attached to;
 * - the edges leaving a vertex are at least a minimum angle apart;
 * - a post's fan of leaves has a free sector, pointing away from the post's
 *   neighbors, and nothing else is inside it.
 *
 * Stress majorization gives the starting positions, and gradient descent over
 * the full energy refines them. Both are deterministic.
 */
export const layoutCore = ({
  vertices,
  edges,
  core,
  leaves,
}: {
  vertices: Map<string, Vertex>
  edges: Map<string, Edge>
  core: Set<string>
  leaves: Map<string, string>
}): Map<string, Position> => {
  const ids = [...core]
  const neighbors = new Map<string, Set<string>>(ids.map(id => [id, new Set()]))
  const coreEdges: [string, string][] = []
  for (const { fromId, toId } of edges.values()) {
    if (core.has(fromId) && core.has(toId) && fromId !== toId) {
      coreEdges.push([fromId, toId])
      neighbors.get(fromId)!.add(toId)
      neighbors.get(toId)!.add(fromId)
    }
  }

  const fans = measureFans({ vertices, leaves })
  const joins = joinComponents(vertices, neighbors)
  const hops = measureIdealDistances({ ids, neighbors, joins, fans })
  // The pairs that pull toward their ideal distance: the edges, and the joins
  // that keep the components together.
  const pulls = new Map(
    [...neighbors].map(([id, ids]) => [id, new Set(ids)] as const),
  )
  for (const [id1, id2] of joins) {
    pulls.get(id1)!.add(id2)
    pulls.get(id2)!.add(id1)
  }
  const positions = majorizeStress({ ids, hops })
  const state = descend({
    vertices,
    ids,
    neighbors,
    pulls,
    coreEdges,
    fans,
    leaves,
    hops,
    positions,
  })
  lastViolations = countViolations(state)
  return positions
}

const measureFans = ({
  vertices,
  leaves,
}: {
  vertices: Map<string, Vertex>
  leaves: Map<string, string>
}): Map<string, FanSize> => {
  const leafVertices = new Map<string, Vertex[]>()
  for (const [leafId, parentId] of leaves) {
    leafVertices.set(parentId, [
      ...(leafVertices.get(parentId) ?? []),
      vertices.get(leafId)!,
    ])
  }
  return new Map(
    [...leafVertices].map(([parentId, leafVertices]) => [
      parentId,
      measureFan(leafVertices),
    ]),
  )
}

/**
 * An edge between each pair of consecutive connected components, joining the
 * posts that share the most tags, so the components are laid out near each
 * other instead of drifting apart.
 */
const joinComponents = (
  vertices: Map<string, Vertex>,
  neighbors: Map<string, Set<string>>,
): [string, string][] => {
  const components = scc(neighbors)
  const joins: [string, string][] = []
  for (let index = 1; index < components.length; index++) {
    joins.push(
      findSimilarInternalVertexPair({
        vertices,
        vertexIds1: components[index - 1]!,
        vertexIds2: components[index]!,
      }),
    )
  }
  return joins
}

const findSimilarInternalVertexPair = ({
  vertices,
  vertexIds1,
  vertexIds2,
}: {
  vertices: Map<string, Vertex>
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

/**
 * The ideal distance between each pair of vertices: the length of the
 * shortest path between them, where an edge is as long as its endpoints need
 * to fit their neighbors' labels around them, capped so that distant vertices
 * are only kept apart rather than pushed to the edges of the drawing.
 */
const measureIdealDistances = ({
  ids,
  neighbors,
  joins,
  fans,
}: {
  ids: string[]
  neighbors: Map<string, Set<string>>
  joins: [string, string][]
  fans: Map<string, FanSize>
}): Map<string, Map<string, number>> => {
  // The radius at which a vertex's neighbors fit, leaving the fan's sector.
  const ringRadius = (id: string): number => {
    const span = fans.get(id)?.span ?? 0
    const freeAngle = Math.max(
      Math.PI / 2,
      2 * Math.PI - span - 2 * MIN_EDGE_ANGLE,
    )
    return (neighbors.get(id)!.size * NEIGHBOR_SPACING) / freeAngle
  }
  const edgeLength = (id1: string, id2: string): number =>
    Math.max(IDEAL_EDGE_LENGTH, ringRadius(id1), ringRadius(id2))

  const adjacency = new Map(
    [...neighbors].map(([id, ids]) => [id, new Set(ids)] as const),
  )
  for (const [id1, id2] of joins) {
    adjacency.get(id1)!.add(id2)
    adjacency.get(id2)!.add(id1)
  }

  return new Map(
    ids.map(sourceId => {
      const distances = new Map<string, number>([[sourceId, 0]])
      const settled = new Set<string>()
      while (settled.size < distances.size) {
        let id: string | undefined
        for (const [candidateId, distance] of distances) {
          if (
            !settled.has(candidateId) &&
            (id === undefined || distance < distances.get(id)!)
          ) {
            id = candidateId
          }
        }
        settled.add(id!)
        for (const neighborId of adjacency.get(id!)!) {
          const distance = distances.get(id!)! + edgeLength(id!, neighborId)
          if (distance < (distances.get(neighborId) ?? Infinity)) {
            distances.set(neighborId, distance)
          }
        }
      }
      return [
        sourceId,
        new Map(
          [...distances].map(([id, distance]) => [
            id,
            Math.min(distance, MAX_IDEAL_DISTANCE),
          ]),
        ),
      ]
    }),
  )
}

/**
 * Stress majorization: starting from a circle, moves each vertex to the
 * weighted average of where its distance to every other vertex would be
 * ideal, until the positions settle.
 */
const majorizeStress = ({
  ids,
  hops,
}: {
  ids: string[]
  hops: Map<string, Map<string, number>>
}): Map<string, Position> => {
  const positions = new Map<string, Position>(
    ids.map((id, index) => {
      const angle = (2 * Math.PI * index) / ids.length
      const radius = (IDEAL_EDGE_LENGTH * ids.length) / (2 * Math.PI)
      return [id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }]
    }),
  )
  if (ids.length < 2) {
    return positions
  }

  for (let iteration = 0; iteration < STRESS_ITERATIONS; iteration++) {
    for (const id of ids) {
      const position = positions.get(id)!
      let sumX = 0
      let sumY = 0
      let sumWeight = 0
      for (const otherId of ids) {
        if (otherId === id) {
          continue
        }
        const other = positions.get(otherId)!
        const ideal = hops.get(id)!.get(otherId)!
        const weight = 1 / ideal ** 2
        const distance = Math.max(
          Math.hypot(position.x - other.x, position.y - other.y),
          1e-6,
        )
        sumX += weight * (other.x + (ideal * (position.x - other.x)) / distance)
        sumY += weight * (other.y + (ideal * (position.y - other.y)) / distance)
        sumWeight += weight
      }
      positions.set(id, { x: sumX / sumWeight, y: sumY / sumWeight })
    }
  }
  return positions
}

/**
 * Gradient descent over the layout energy: every step moves each vertex
 * against the numeric gradient of its local energy.
 */
const descend = ({
  vertices,
  ids,
  neighbors,
  pulls,
  coreEdges,
  fans,
  leaves,
  hops,
  positions,
}: {
  vertices: Map<string, Vertex>
  ids: string[]
  neighbors: Map<string, Set<string>>
  pulls: Map<string, Set<string>>
  coreEdges: [string, string][]
  fans: Map<string, FanSize>
  leaves: Map<string, string>
  hops: Map<string, Map<string, number>>
  positions: Map<string, Position>
}): EnergyState => {
  const leafIds = new Map<string, string[]>(ids.map(id => [id, []]))
  for (const [leafId, parentId] of leaves) {
    leafIds.get(parentId)!.push(leafId)
  }
  const edgesOf = new Map<string, [string, string][]>(ids.map(id => [id, []]))
  for (const edge of coreEdges) {
    edgesOf.get(edge[0])!.push(edge)
    edgesOf.get(edge[1])!.push(edge)
  }
  const shapes = new Map(ids.map(id => [id, getShape(vertices.get(id)!)]))
  const state: EnergyState = {
    pulls,
    similarities: measureSimilarities(vertices, ids),
    shapes,
    leafIds,
    leafOwners: leaves,
    allLeafIds: [...leaves.keys()],
    leafShapes: new Map(
      [...leaves.keys()].map(id => [id, getShape(vertices.get(id)!)]),
    ),
    leafOffsets: new Map(),
    leafPositions: new Map(),
    segments: [],
    coreEntries: [],
    leafEntries: [],
    foreignEdgeIndices: coreEdges.map(([fromId, toId]) =>
      coreEdges.flatMap((other, index) =>
        other[0] === fromId ||
        other[0] === toId ||
        other[1] === fromId ||
        other[1] === toId
          ? []
          : [index],
      ),
    ),
    ownEdgeIndices: new Map(
      ids.map(id => [
        id,
        coreEdges.flatMap((edge, index) =>
          edge[0] === id || edge[1] === id ? [index] : [],
        ),
      ]),
    ),
    maxReach: Math.max(...[...shapes.values()].map(shape => shape.reach)),
    neighborLists: new Map(ids.map(id => [id, [...neighbors.get(id)!]])),
    penaltyShare: 1,
    vertices,
    ids,
    neighbors,
    coreEdges,
    edgesOf,
    fans,
    hops,
    positions,
    fanDirections: new Map(),
  }

  for (let step = 0; step < DESCENT_STEPS; step++) {
    const progress = step / DESCENT_STEPS
    // Penalties start soft, so the stress settles the overall arrangement
    // first, and harden as the run goes on to resolve the violations left.
    state.penaltyShare = Math.max(
      MIN_PENALTY_SHARE,
      Math.min(1, progress / PENALTY_RAMP),
    )
    const maxMove = END_STEP + (START_STEP - END_STEP) * (1 - progress)
    // Fans point away from the post's neighbors. The directions are held for
    // the step so that every gradient is taken against a fixed picture.
    state.fanDirections = new Map(
      [...fans.keys()].map(id => [id, getFanDirection(state, id)]),
    )
    // The leaves are placed around their post for the step, and move with it,
    // so their boxes take part in the overlap and clearance terms.
    state.leafOffsets = new Map()
    for (const [postId, fan] of fans) {
      const offsets = placeFan({
        vertices,
        leafIds: leafIds.get(postId)!,
        direction: state.fanDirections.get(postId)!,
        span: fan.span,
      })
      for (const [leafId, offset] of offsets) {
        state.leafOffsets.set(leafId, offset)
      }
    }
    state.leafPositions = new Map(
      state.allLeafIds.map(leafId => [leafId, getLeafPosition(state, leafId)]),
    )
    state.segments = coreEdges.map(edge => getSegment(state, edge))
    state.coreEntries = ids.map(id => ({
      id,
      position: positions.get(id)!,
      shape: shapes.get(id)!,
    }))
    state.leafEntries = state.allLeafIds.map(leafId => ({
      id: leafId,
      ownerId: leaves.get(leafId)!,
      position: state.leafPositions.get(leafId)!,
      shape: state.leafShapes.get(leafId)!,
      offset: state.leafOffsets.get(leafId)!,
    }))

    // Every vertex moves against the numeric gradient of its local energy,
    // no farther than the current step allows.
    const moves = new Map<string, Position>()
    for (const id of ids) {
      const position = positions.get(id)!
      const gradient = { x: 0, y: 0 }
      for (const [dx, dy, axis] of [
        [GRADIENT_DELTA, 0, `x`],
        [0, GRADIENT_DELTA, `y`],
      ] as const) {
        positions.set(id, { x: position.x + dx, y: position.y + dy })
        const forward = getLocalEnergy(state, id)
        positions.set(id, { x: position.x - dx, y: position.y - dy })
        const backward = getLocalEnergy(state, id)
        gradient[axis] = (forward - backward) / (2 * GRADIENT_DELTA)
      }
      positions.set(id, position)
      const length = Math.hypot(gradient.x, gradient.y)
      if (length === 0) {
        continue
      }
      const distance = Math.min(maxMove, length * LEARNING_RATE)
      moves.set(id, {
        x: position.x - (gradient.x / length) * distance,
        y: position.y - (gradient.y / length) * distance,
      })
    }
    for (const [id, move] of moves) {
      positions.set(id, move)
    }
  }
  return state
}

/**
 * The violations of each term in the last layout, for tuning against a real
 * graph.
 */
export let lastViolations: Violations | undefined

type Violations = {
  stress: number
  overlaps: number
  leafOverlaps: number
  clearances: number
  leafClearances: number
  angles: number
  fanIntrusions: number
  crossings: number
}

const countViolations = (state: EnergyState): Violations => {
  const {
    ids,
    coreEdges,
    positions,
    shapes,
    allLeafIds,
    leafOwners,
    leafShapes,
    foreignEdgeIndices,
  } = state
  const violations: Violations = {
    stress: 0,
    overlaps: 0,
    leafOverlaps: 0,
    clearances: 0,
    leafClearances: 0,
    angles: 0,
    fanIntrusions: 0,
    crossings: 0,
  }
  const box = (id: string): [Position, Shape] =>
    leafOwners.has(id)
      ? [getLeafPosition(state, id), leafShapes.get(id)!]
      : [positions.get(id)!, shapes.get(id)!]
  const allIds = [...ids, ...allLeafIds]
  for (const [index, id1] of allIds.entries()) {
    for (const id2 of allIds.slice(index + 1)) {
      const owner1 = leafOwners.get(id1) ?? id1
      const owner2 = leafOwners.get(id2) ?? id2
      if (owner1 === owner2) {
        continue
      }
      if (getOverlapEnergy(state, ...box(id1), ...box(id2)) > 0) {
        if (leafOwners.has(id1) || leafOwners.has(id2)) {
          violations.leafOverlaps++
        } else {
          violations.overlaps++
        }
      }
    }
  }
  const segments = coreEdges.map(edge => getSegment(state, edge))
  for (const [index, segment] of segments.entries()) {
    for (const otherIndex of foreignEdgeIndices[index]!) {
      if (
        otherIndex > index &&
        getCrossingEnergy(state, segment, segments[otherIndex]!) > 0
      ) {
        violations.crossings++
      }
    }
    for (const id of allIds) {
      const owner = leafOwners.get(id) ?? id
      if (
        owner !== segment.fromId &&
        owner !== segment.toId &&
        getClearanceEnergy(state, segment, ...box(id)) > 0
      ) {
        if (leafOwners.has(id)) {
          violations.leafClearances++
        } else {
          violations.clearances++
        }
      }
    }
  }
  for (const id of ids) {
    violations.stress += getStress(state, id)
    if (getAngleEnergy(state, id) > 0) {
      violations.angles++
    }
    for (const otherId of ids) {
      if (otherId !== id && getFanEnergy(state, id, otherId) > 0) {
        violations.fanIntrusions++
      }
    }
  }
  return violations
}

/** A vertex's box relative to its center, with the label's corners. */
type Shape = {
  left: number
  right: number
  top: number
  bottom: number
  corners: [number, number][]
  reach: number
}

const getShape = (vertex: Vertex): Shape => {
  const { left, right, top, bottom } = getVertexBox(vertex, { x: 0, y: 0 })
  const corners: [number, number][] = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ]
  return {
    left,
    right,
    top,
    bottom,
    corners,
    reach: Math.max(...corners.map(([x, y]) => Math.hypot(x, y))),
  }
}

const getShapeExtent = (shape: Shape, angle: number): number => {
  const sin = Math.sin(angle)
  const cos = Math.cos(angle)
  let extent = 0
  for (const [x, y] of shape.corners) {
    extent = Math.max(extent, Math.abs(-x * sin + y * cos))
  }
  return extent
}

type EnergyState = {
  pulls: Map<string, Set<string>>
  leafIds: Map<string, string[]>
  leafOwners: Map<string, string>
  allLeafIds: string[]
  leafShapes: Map<string, Shape>
  /** Where each leaf is relative to its post, for the current step. */
  leafOffsets: Map<string, Position>
  /** Where each leaf is, for the positions the posts had at the step's start. */
  leafPositions: Map<string, Position>
  /** Every core edge's geometry, for the positions at the step's start. */
  segments: Segment[]
  /** Every core vertex with its position at the step's start and its shape. */
  coreEntries: Entry[]
  /** Every leaf with its position at the step's start, its shape, and owner. */
  leafEntries: LeafEntry[]
  /** For each core edge, the indices of the edges sharing no endpoint with it. */
  foreignEdgeIndices: number[][]
  /** For each vertex, the indices of its own edges. */
  ownEdgeIndices: Map<string, number[]>
  /** How much each pair of posts shares in tags, from 0 to 1, keyed by post. */
  similarities: Map<string, Map<string, number>>
  shapes: Map<string, Shape>
  maxReach: number
  /** How much of their full weight the penalties currently have. */
  penaltyShare: number
  neighborLists: Map<string, string[]>
  vertices: Map<string, Vertex>
  ids: string[]
  neighbors: Map<string, Set<string>>
  coreEdges: [string, string][]
  edgesOf: Map<string, [string, string][]>
  fans: Map<string, FanSize>
  hops: Map<string, Map<string, number>>
  positions: Map<string, Position>
  fanDirections: Map<string, number>
}

const getFanDirection = (state: EnergyState, id: string): number =>
  getDirectionAwayFrom(
    state.positions.get(id)!,
    [...state.neighbors.get(id)!].map(neighborId =>
      state.positions.get(neighborId)!,
    ),
  )

/**
 * The angle pointing away from the given positions, which is where a post's
 * fan goes, or up when there is nothing to point away from.
 */
export const getDirectionAwayFrom = (
  position: Position,
  others: Position[],
): number => {
  let sumX = 0
  let sumY = 0
  for (const other of others) {
    const distance = Math.max(
      Math.hypot(other.x - position.x, other.y - position.y),
      1e-6,
    )
    sumX += (other.x - position.x) / distance
    sumY += (other.y - position.y) / distance
  }
  return sumX === 0 && sumY === 0 ? -Math.PI / 2 : Math.atan2(-sumY, -sumX)
}

/**
 * How much each pair of posts has in common: the share of the larger post's
 * tags that the other post has too.
 */
const measureSimilarities = (
  vertices: Map<string, Vertex>,
  ids: string[],
): Map<string, Map<string, number>> => {
  const postIds = ids.filter(id => vertices.get(id)!.type === `internal`)
  return new Map(
    postIds.map(id => {
      const { tags } = vertices.get(id)!
      return [
        id,
        new Map(
          postIds
            .filter(otherId => otherId !== id)
            .map((otherId): [string, number] => {
              const otherTags = vertices.get(otherId)!.tags
              const shared = tags.intersection(otherTags).size
              return [otherId, shared / Math.max(tags.size, otherTags.size, 1)]
            })
            .filter(([, similarity]) => similarity > 0),
        ),
      ]
    }),
  )
}

type Entry = { id: string; position: Position; shape: Shape }
type LeafEntry = Entry & { ownerId: string; offset: Position }

/** An edge's endpoints and direction. */
type Segment = {
  fromId: string
  toId: string
  from: Position
  to: Position
  dx: number
  dy: number
  lengthSquared: number
}

const getSegment = (
  state: EnergyState,
  [fromId, toId]: [string, string],
): Segment => {
  const from = state.positions.get(fromId)!
  const to = state.positions.get(toId)!
  const dx = to.x - from.x
  const dy = to.y - from.y
  return { fromId, toId, from, to, dx, dy, lengthSquared: dx * dx + dy * dy }
}

/** Every energy term that the given vertex's position takes part in. */
const getLocalEnergy = (state: EnergyState, id: string): number => {
  const {
    coreEdges,
    positions,
    shapes,
    maxReach,
    neighborLists,
    coreEntries,
    leafEntries,
    segments,
    ownEdgeIndices,
    foreignEdgeIndices,
  } = state
  let energy = getStress(state, id)

  const position = positions.get(id)!
  const shape = shapes.get(id)!
  for (const other of coreEntries) {
    if (other.id === id) {
      continue
    }
    if (
      Math.abs(other.position.x - position.x) < 2 * maxReach &&
      Math.abs(other.position.y - position.y) < 2 * maxReach
    ) {
      energy += getOverlapEnergy(
        state,
        position,
        shape,
        other.position,
        other.shape,
      )
    }
    energy += getFanEnergy(state, other.id, id)
    energy += getFanEnergy(state, id, other.id)
  }

  // The vertex's box against every other post's leaves, and its own leaves
  // against every other box and edge. The vertex's own leaves move with it,
  // so their positions follow its current one. The others are as at the
  // step's start.
  const ownLeaves: Entry[] = []
  for (const leaf of leafEntries) {
    if (leaf.ownerId === id) {
      ownLeaves.push({
        id: leaf.id,
        position: {
          x: position.x + leaf.offset.x,
          y: position.y + leaf.offset.y,
        },
        shape: leaf.shape,
      })
    }
  }
  for (const leaf of leafEntries) {
    if (leaf.ownerId === id) {
      continue
    }
    energy += getOverlapEnergy(
      state,
      position,
      shape,
      leaf.position,
      leaf.shape,
    )
    for (const ownLeaf of ownLeaves) {
      energy += getOverlapEnergy(
        state,
        ownLeaf.position,
        ownLeaf.shape,
        leaf.position,
        leaf.shape,
      )
    }
  }
  // The edges not attached to the vertex keep the geometry they had at the
  // step's start. The vertex's own edges follow its current position.
  const ownSegments = ownEdgeIndices.get(id)!.map(index => ({
    index,
    segment: getSegment(state, coreEdges[index]!),
  }))
  for (const { position: leaf, shape: leafShape } of ownLeaves) {
    for (const other of coreEntries) {
      if (other.id !== id) {
        energy += getOverlapEnergy(
          state,
          leaf,
          leafShape,
          other.position,
          other.shape,
        )
      }
    }
    for (const segment of segments) {
      if (segment.fromId !== id && segment.toId !== id) {
        energy += getClearanceEnergy(state, segment, leaf, leafShape)
      }
    }
  }

  for (const { index, segment } of ownSegments) {
    for (const other of coreEntries) {
      if (other.id !== segment.fromId && other.id !== segment.toId) {
        energy += getClearanceEnergy(
          state,
          segment,
          other.position,
          other.shape,
        )
      }
    }
    for (const leaf of leafEntries) {
      if (leaf.ownerId !== segment.fromId && leaf.ownerId !== segment.toId) {
        energy += getClearanceEnergy(state, segment, leaf.position, leaf.shape)
      }
    }
    for (const otherIndex of foreignEdgeIndices[index]!) {
      energy += getCrossingEnergy(state, segment, segments[otherIndex]!)
    }
  }
  for (const segment of segments) {
    if (segment.fromId !== id && segment.toId !== id) {
      energy += getClearanceEnergy(state, segment, position, shape)
    }
  }

  energy += getAngleEnergy(state, id)
  for (const neighborId of neighborLists.get(id)!) {
    energy += getAngleEnergy(state, neighborId)
  }
  return energy
}

const getLeafPosition = (state: EnergyState, leafId: string): Position => {
  const post = state.positions.get(state.leafOwners.get(leafId)!)!
  const offset = state.leafOffsets.get(leafId)!
  return { x: post.x + offset.x, y: post.y + offset.y }
}

/**
 * How far the vertex is from its ideal distance to every other vertex. A
 * neighbor pulls and pushes toward the ideal, so edges have their length.
 * Any other vertex only pushes, so the graph stays as compact as its edges
 * allow instead of spreading every pair to its ideal distance.
 */
const getStress = (state: EnergyState, id: string): number => {
  const position = state.positions.get(id)!
  const pullIds = state.pulls.get(id)!
  let stress = 0
  let repulsion = 0
  for (const otherId of state.ids) {
    if (otherId === id) {
      continue
    }
    const other = state.positions.get(otherId)!
    const ideal = state.hops.get(id)!.get(otherId)!
    const distance = Math.hypot(position.x - other.x, position.y - other.y)
    if (distance < ideal || pullIds.has(otherId)) {
      // Quadratic near the ideal and linear beyond it, so a vertex far from
      // where it belongs is pulled steadily rather than overwhelmingly.
      const error = Math.abs(distance - ideal) / ideal
      stress += error < 1 ? error ** 2 : 2 * error - 1
    }
    // Every pair repels a little at any distance, which is what spreads a
    // hub's neighbors around it and keeps unrelated clusters apart.
    repulsion += IDEAL_EDGE_LENGTH / Math.max(distance, 1)
  }
  // Posts that share tags are drawn toward each other in proportion to how
  // much they share, so a post with few links still sits with its topic.
  let similarity = 0
  for (const [otherId, share] of state.similarities.get(id) ?? []) {
    const other = state.positions.get(otherId)!
    const distance = Math.hypot(position.x - other.x, position.y - other.y)
    if (distance > SIMILARITY_DISTANCE) {
      similarity +=
        share * ((distance - SIMILARITY_DISTANCE) / SIMILARITY_DISTANCE) ** 2
    }
  }
  return (
    STRESS_WEIGHT * stress +
    REPULSION_WEIGHT * repulsion +
    SIMILARITY_WEIGHT * similarity
  )
}

const getOverlapEnergy = (
  state: EnergyState,
  position1: Position,
  shape1: Shape,
  position2: Position,
  shape2: Shape,
): number => {
  const overlapX =
    Math.min(position1.x + shape1.right, position2.x + shape2.right) -
    Math.max(position1.x + shape1.left, position2.x + shape2.left)
  const overlapY =
    Math.min(position1.y + shape1.bottom, position2.y + shape2.bottom) -
    Math.max(position1.y + shape1.top, position2.y + shape2.top)
  if (overlapX <= 0 || overlapY <= 0) {
    return 0
  }
  return (
    state.penaltyShare *
    OVERLAP_WEIGHT *
    (Math.min(overlapX, overlapY) / IDEAL_EDGE_LENGTH) ** 2
  )
}

/** How far the edge intrudes on the vertex's box, if it passes it at all. */
const getClearanceEnergy = (
  state: EnergyState,
  { from, dx, dy, lengthSquared }: Segment,
  position: Position,
  shape: Shape,
): number => {
  if (lengthSquared === 0) {
    return 0
  }
  const px = position.x - from.x
  const py = position.y - from.y
  // The projection onto the edge, scaled by the edge's length, so that the
  // bounds check needs no square root.
  const alongScaled = px * dx + py * dy
  if (alongScaled <= 0 || alongScaled >= lengthSquared) {
    return 0
  }
  const length = Math.sqrt(lengthSquared)
  const distance = Math.abs(px * dy - py * dx) / length
  // No box reaches past its farthest corner, so the exact extent, which costs
  // a sine and a cosine, is only needed when the edge is within that.
  if (distance >= shape.reach) {
    return 0
  }
  const needed = getShapeExtent(shape, Math.atan2(dy, dx))
  if (distance >= needed) {
    return 0
  }
  return (
    state.penaltyShare *
    CLEARANCE_WEIGHT *
    ((needed - distance) / IDEAL_EDGE_LENGTH) ** 2
  )
}

/** How much closer than the minimum angle the vertex's edges are to each other. */
const getAngleEnergy = (state: EnergyState, id: string): number => {
  const neighborIds = state.neighborLists.get(id)!
  if (neighborIds.length < 2) {
    return 0
  }
  const position = state.positions.get(id)!
  const angles = neighborIds.map(neighborId => {
    const neighbor = state.positions.get(neighborId)!
    return Math.atan2(neighbor.y - position.y, neighbor.x - position.x)
  })
  angles.sort((angle1, angle2) => angle1 - angle2)
  // A hub's neighbors are also spread evenly around it, outside its fan.
  const isHub = neighborIds.length >= HUB_DEGREE
  const fan = state.fans.get(id)
  const freeAngle = 2 * Math.PI - (fan ? fan.span + 2 * MIN_EDGE_ANGLE : 0)
  const evenGap = freeAngle / neighborIds.length
  let energy = 0
  for (const [index, angle] of angles.entries()) {
    const next = angles[(index + 1) % angles.length]!
    const between = (next - angle + 2 * Math.PI) % (2 * Math.PI)
    if (between < MIN_EDGE_ANGLE) {
      energy +=
        ANGLE_WEIGHT * ((MIN_EDGE_ANGLE - between) / MIN_EDGE_ANGLE) ** 2
    }
    if (isHub && between < evenGap) {
      energy += SPREAD_WEIGHT * ((evenGap - between) / evenGap) ** 2
    }
  }
  return energy
}

/**
 * How far a neighbor's edge enters the post's fan sector. The leaves are
 * placed in that sector, so a neighbor's edge must leave the post outside it.
 */
const getFanEnergy = (
  state: EnergyState,
  postId: string,
  otherId: string,
): number => {
  const fan = state.fans.get(postId)
  if (!fan || !state.neighbors.get(postId)!.has(otherId)) {
    return 0
  }
  const direction = state.fanDirections.get(postId)!
  const post = state.positions.get(postId)!
  const other = state.positions.get(otherId)!
  const halfSpan = fan.span / 2 + MIN_EDGE_ANGLE
  const offAxis = Math.abs(
    normalizeAngle(Math.atan2(other.y - post.y, other.x - post.x) - direction),
  )
  if (offAxis >= halfSpan) {
    return 0
  }
  return (
    state.penaltyShare *
    ANGLE_WEIGHT *
    ((halfSpan - offAxis) / MIN_EDGE_ANGLE) ** 2
  )
}

/**
 * How deeply two edges cross: zero when they don't, rising to one when they
 * cross at both their midpoints, so that moving a crossing toward an endpoint
 * lowers the energy until the crossing disappears.
 */
const getCrossingEnergy = (
  state: EnergyState,
  { from: from1, dx: dx1, dy: dy1 }: Segment,
  { from: from2, dx: dx2, dy: dy2 }: Segment,
): number => {
  const denominator = dx1 * dy2 - dy1 * dx2
  if (denominator === 0) {
    return 0
  }
  const along1 =
    ((from2.x - from1.x) * dy2 - (from2.y - from1.y) * dx2) / denominator
  const along2 =
    ((from2.x - from1.x) * dy1 - (from2.y - from1.y) * dx1) / denominator
  if (along1 <= 0 || along1 >= 1 || along2 <= 0 || along2 >= 1) {
    return 0
  }
  const depth1 = Math.min(along1, 1 - along1) * 2
  const depth2 = Math.min(along2, 1 - along2) * 2
  return state.penaltyShare * CROSSING_WEIGHT * depth1 * depth2
}

const normalizeAngle = (angle: number): number =>
  ((angle + 3 * Math.PI) % (2 * Math.PI)) - Math.PI

/** The distance between two vertices one edge apart, which sets the scale. */
const IDEAL_EDGE_LENGTH = 500
/** The room each neighbor's label takes on the ring around a vertex. */
const NEIGHBOR_SPACING = 300
const MAX_IDEAL_DISTANCE = 1.2 * IDEAL_EDGE_LENGTH
const STRESS_ITERATIONS = 300

const DESCENT_STEPS = 1200
const MIN_PENALTY_SHARE = 0.05
// The share of the run over which the penalties reach full strength.
const PENALTY_RAMP = 0.3
const START_STEP = IDEAL_EDGE_LENGTH / 4
const END_STEP = 8
const GRADIENT_DELTA = 1
const LEARNING_RATE = 2000

// The energy terms, each normalized to the edge length or the minimum angle
// and weighted by how much a violation matters.
const STRESS_WEIGHT = 6
const REPULSION_WEIGHT = 0.5
const OVERLAP_WEIGHT = 1000
const CLEARANCE_WEIGHT = 3
const ANGLE_WEIGHT = 30
/** A vertex with this many neighbors has them spread evenly around it. */
const HUB_DEGREE = 4
const SPREAD_WEIGHT = 3
const CROSSING_WEIGHT = 5
/** Posts that share all their tags are drawn to within this distance. */
const SIMILARITY_DISTANCE = 1.5 * IDEAL_EDGE_LENGTH
const SIMILARITY_WEIGHT = 2
/** The smallest angle between two edges leaving a vertex. */
const MIN_EDGE_ANGLE = (12 * Math.PI) / 180
