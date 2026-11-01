import {
  INTERNAL_LABEL_WIDTH,
  LABEL_CHAR_WIDTH_EM,
  LABEL_FONT_SIZE,
  LABEL_LINE_HEIGHT_EM,
  LABEL_OFFSET,
  LABEL_PADDING_X_EM,
  MIN_GRAPH_WIDTH_RATIO,
  VERTEX_RADIUS,
  VERTEX_SIZE,
} from './graph-constants.ts'
import type { Vertex } from './graph.ts'

/**
 * The space a vertex takes on the page, estimated from its label, and the
 * space a post's fan of leaves takes around it. Lengths are CSS pixels at the
 * graph's full width.
 */

export type Position = {
  x: number
  y: number
}

export type Box = Position & {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * The box a vertex occupies on the page: its dot and the label above it. The
 * graph may render narrower than its full width, which makes labels larger
 * relative to it, so the box is inflated to cover that.
 */
export const getVertexBox = (vertex: Vertex, { x, y }: Position): Box => {
  const { width } = getLabelSize(vertex)
  const halfWidth = (Math.max(width, VERTEX_SIZE) / 2) * LABEL_INFLATION
  return {
    x,
    y,
    left: x - halfWidth - BOX_GAP,
    right: x + halfWidth + BOX_GAP,
    top: y - getBoxTop(vertex),
    bottom: y + VERTEX_RADIUS + BOX_GAP,
  }
}

/** How far a vertex's box reaches above the vertex's center. */
const getBoxTop = (vertex: Vertex): number => {
  const { height } = getLabelSize(vertex)
  return LABEL_OFFSET + height * LABEL_INFLATION + BOX_GAP
}

/**
 * How far a vertex's box reaches, measured perpendicular to a line through the
 * vertex's center at the given angle.
 */
const getBoxExtent = (vertex: Vertex, angle: number): number => {
  const { width } = getLabelSize(vertex)
  const halfWidth = (width * LABEL_INFLATION) / 2 + BOX_GAP
  const top = -getBoxTop(vertex)
  const bottom = VERTEX_RADIUS + BOX_GAP
  const corners = [
    [-halfWidth, top],
    [halfWidth, top],
    [-halfWidth, bottom],
    [halfWidth, bottom],
  ]
  return Math.max(
    ...corners.map(([x, y]) =>
      Math.abs(-x! * Math.sin(angle) + y! * Math.cos(angle)),
    ),
  )
}

/** The farthest any point of a vertex's box is from the vertex's center. */
const getBoxReach = (vertex: Vertex): number => {
  const { width } = getLabelSize(vertex)
  const halfWidth = (width * LABEL_INFLATION) / 2 + BOX_GAP
  return Math.hypot(halfWidth, getBoxTop(vertex))
}

/**
 * An upper bound on a label's rendered size. Post labels wrap at a fixed
 * width, so a post label is as wide as its text up to that width, and as tall
 * as the lines the widest glyphs would need. Site labels never wrap.
 */
const getLabelSize = (vertex: Vertex): { width: number; height: number } => {
  const lines =
    vertex.type === `internal`
      ? wrapLines(vertex.label.split(` `), INTERNAL_LABEL_WIDTH)
      : [vertex.label]
  const width =
    vertex.type === `internal`
      ? Math.min(INTERNAL_LABEL_WIDTH, vertex.label.length * CHAR_WIDTH)
      : Math.max(...lines.map(line => line.length * CHAR_WIDTH))
  return {
    width: width + LABEL_PADDING_X * 2,
    height: lines.length * LINE_HEIGHT,
  }
}

const wrapLines = (words: string[], maxWidth: number): string[] => {
  const lines: string[] = []
  let line = ``
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && candidate.length * CHAR_WIDTH > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  lines.push(line)
  return lines
}

/**
 * The room a post's fan of leaves needs: the radius of its near ring, the
 * angle it spans at that radius, and how far from the post it reaches. The
 * fan is placed later with exact spacing, so this is the estimate the core
 * layout reserves room for.
 */
export const measureFan = (leafVertices: Vertex[]): FanSize => {
  const count = leafVertices.length
  const extents = leafVertices.map(
    vertex => (getBoxExtent(vertex, 0) + getBoxExtent(vertex, Math.PI / 2)) / 2,
  )
  const meanExtent = extents.reduce((sum, extent) => sum + extent, 0) / count
  const arcRadius = getFanArcRadius(count)
  const neededSpan =
    count * Math.asin(Math.min(1, (meanExtent + EDGE_CLEARANCE) / arcRadius))
  const radius = arcRadius * Math.max(1, neededSpan / (2 * Math.PI))
  const span = Math.min(neededSpan, 2 * Math.PI)
  const reach =
    radius + FAN_STAGGER + Math.max(...leafVertices.map(getBoxReach))
  return { radius, span, reach }
}

export type FanSize = { radius: number; span: number; reach: number }

/**
 * Where a post's leaves go relative to the post, in a fan centered on the
 * given direction. Leaves alternate between a near and a far ring. Each pair
 * of neighboring leaves is spaced so that the edge to the far one clears the
 * near one's label, and the fan spreads across its span, spills past it, or
 * becomes a full ring with a larger radius, whichever the spacing needs. The
 * tallest labels take the near ring so the far ring stays close.
 */
export const placeFan = ({
  vertices,
  leafIds,
  direction,
  span,
}: {
  vertices: Map<string, Vertex>
  leafIds: string[]
  direction: number
  span: number
}): Map<string, Position> => {
  const gapStart = direction - span / 2
  const gapAngle = span
  const boxTop = (id: string): number => getBoxTop(vertices.get(id)!)
  const sortedIds = [...leafIds].sort((id1, id2) => boxTop(id2) - boxTop(id1))
  const count = sortedIds.length
  const isNear = (index: number): boolean => index % 2 === 0
  const stagger = Math.max(
    FAN_STAGGER,
    ...sortedIds
      .filter((_, index) => !isNear(index))
      .map(id => boxTop(id) + EDGE_CLEARANCE),
  )

  let radius = getFanArcRadius(count)
  let angles = sortedIds.map(
    (_, index) => gapStart + (gapAngle * (index + 0.5)) / count,
  )
  for (let iteration = 0; iteration < FAN_ITERATIONS; iteration++) {
    // The angle between two neighbors is set by whichever is on the near ring.
    const neededGap = (index1: number, index2: number): number => {
      const nearIndex = isNear(index1) ? index1 : index2
      const extent = getBoxExtent(
        vertices.get(sortedIds[nearIndex]!)!,
        angles[nearIndex]!,
      )
      return Math.asin(Math.min(1, (extent + EDGE_CLEARANCE) / radius))
    }
    const gaps = Array.from({ length: count - 1 }, (_, index) =>
      neededGap(index, index + 1),
    )
    const total = gaps.reduce((sum, gap) => sum + gap, 0)
    const wrapGap = count > 1 ? neededGap(count - 1, 0) : 0
    if (total + wrapGap > 2 * Math.PI) {
      radius *= (total + wrapGap) / (2 * Math.PI)
      continue
    }

    const isRing = total > gapAngle && 2 * Math.PI - total < wrapGap
    const fanSpan = isRing ? 2 * Math.PI - wrapGap : Math.max(gapAngle, total)
    const extra = (fanSpan - total) / count
    const first =
      gapStart + (isRing ? wrapGap : gapAngle - fanSpan) / 2 + extra / 2
    angles = gaps.reduce(
      (angles, gap) => [...angles, angles.at(-1)! + gap + extra],
      [first],
    )
  }

  return new Map(
    sortedIds.map((leafId, index) => {
      const leafRadius = radius + (isNear(index) ? 0 : stagger)
      return [
        leafId,
        {
          x: Math.cos(angles[index]!) * leafRadius,
          y: Math.sin(angles[index]!) * leafRadius,
        },
      ]
    }),
  )
}

/** The radius of the near ring that fits the given number of leaf labels. */
const getFanArcRadius = (leafCount: number): number =>
  Math.max(MIN_FAN_RADIUS, (leafCount * LEAF_SPACING) / (2 * Math.PI))

// Label metrics in CSS pixels at the largest font size.
const CHAR_WIDTH = LABEL_CHAR_WIDTH_EM * LABEL_FONT_SIZE
const LINE_HEIGHT = LABEL_LINE_HEIGHT_EM * LABEL_FONT_SIZE
const LABEL_PADDING_X = LABEL_PADDING_X_EM * LABEL_FONT_SIZE
// Labels keep their pixel size while the graph renders narrower than its full
// width, so their boxes are inflated to the narrowest render.
const LABEL_INFLATION = 1 / MIN_GRAPH_WIDTH_RATIO
/** The space kept between neighboring boxes. */
const BOX_GAP = 8
/** The distance kept between an edge and the labels it passes. */
const EDGE_CLEARANCE = 20

const LEAF_SPACING = 210
const MIN_FAN_RADIUS = 250
/** The far ring of a fan is at least this much farther out than the near. */
const FAN_STAGGER = 130
// Spacing depends on the angles, which depend on the spacing, so it settles
// over a few rounds.
const FAN_ITERATIONS = 4
