import { expect, test } from 'vitest'
import { measureFan } from './graph-geometry.ts'
import { getVertexBox, layoutGraph } from './graph-layout.ts'
import type { Box, GraphLayout, Position } from './graph-layout.ts'
import type { Graph } from './graph.ts'
import { createGraph } from '~/test/graph.ts'

const range = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => index)

const FAN_SIZE = 20
const FAN = range(FAN_SIZE).map(index => `site-${index}.com`)
const SHARED = [`shared-a.com`, `shared-b.com`]
const POSTS = [`hub`, `post-1`, `post-2`, `post-3`, `post-4`]

/** A hub post with a fan of sites, and a core of posts sharing two sites. */
const createFannedGraph = (): Graph =>
  createGraph({
    posts: POSTS.map(id => ({ id })),
    externals: [...FAN, ...SHARED].map(id => ({
      id,
      hrefs: [`https://${id}`],
    })),
    edges: [
      ...FAN.map(id => ({ fromId: `hub`, toId: id, hrefs: [`https://${id}`] })),
      ...POSTS.flatMap(postId =>
        SHARED.map(id => ({
          fromId: postId,
          toId: id,
          hrefs: [`https://${id}`],
        })),
      ),
      { fromId: `post-1`, toId: `post-2`, hrefs: [`/post-2`] },
    ],
  })

const distance = (position1: Position, position2: Position): number =>
  Math.hypot(position1.x - position2.x, position1.y - position2.y)

/** The given vertices farther than `radius` from `centerId`. */
const findVerticesOutside = (
  positions: GraphLayout[`positions`],
  ids: string[],
  { centerId, radius }: { centerId: string; radius: number },
): string[] => {
  const center = positions.get(centerId)!
  return ids.filter(id => distance(center, positions.get(id)!) > radius)
}

/** The angle in degrees between the edges from `fromId` to the two vertices. */
const angleBetweenEdges = (
  positions: GraphLayout[`positions`],
  fromId: string,
  [toId1, toId2]: [string, string],
): number => {
  const from = positions.get(fromId)!
  const angle = (id: string): number => {
    const { x, y } = positions.get(id)!
    return Math.atan2(y - from.y, x - from.x)
  }
  const difference = Math.abs(angle(toId1) - angle(toId2))
  return (Math.min(difference, 2 * Math.PI - difference) * 180) / Math.PI
}

const findOverlappingPairs = (boxes: Map<string, Box>): [string, string][] => {
  const entries = [...boxes]
  return entries.flatMap(([id1, box1], index) =>
    entries
      .slice(index + 1)
      .filter(
        ([, box2]) =>
          box1.left < box2.right &&
          box2.left < box1.right &&
          box1.top < box2.bottom &&
          box2.top < box1.bottom,
      )
      .map(([id2]): [string, string] => [id1, id2]),
  )
}

const findPositionsOutside = ({
  positions,
  boundingBox: { width, height },
}: GraphLayout): string[] =>
  [...positions]
    .filter(
      ([, { x, y }]) =>
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        y < 0 ||
        x > width ||
        y > height,
    )
    .map(([id]) => id)

test(`sites linked from one post stay within the fan's reach of it`, () => {
  const graph = createFannedGraph()

  const { positions } = layoutGraph(graph)

  const { reach } = measureFan(FAN.map(id => graph.vertices.get(id)!))
  expect(
    findVerticesOutside(positions, FAN, { centerId: `hub`, radius: reach }),
  ).toStrictEqual([])
})

test(`edges from a post to the sites it shares with other posts do not coincide`, () => {
  const graph = createFannedGraph()

  const { positions } = layoutGraph(graph)

  const narrowAngles = POSTS.map(postId =>
    angleBetweenEdges(positions, postId, [`shared-a.com`, `shared-b.com`]),
  ).filter(angle => angle < 5)
  expect(narrowAngles).toStrictEqual([])
})

test(`no two vertex boxes overlap`, () => {
  const graph = createFannedGraph()

  const { positions } = layoutGraph(graph)

  const boxes = new Map(
    [...positions].map(([id, position]) => [
      id,
      getVertexBox(graph.vertices.get(id)!, position),
    ]),
  )
  expect(findOverlappingPairs(boxes)).toStrictEqual([])
})

test(`every vertex is positioned inside the bounding box`, () => {
  const graph = createFannedGraph()

  const layout = layoutGraph(graph)

  expect([...layout.positions.keys()].sort()).toStrictEqual(
    [...graph.vertices.keys()].sort(),
  )
  expect(findPositionsOutside(layout)).toStrictEqual([])
})

test(`a post with no links is positioned inside the bounding box`, () => {
  const graph = createGraph({
    posts: [{ id: `linked` }, { id: `alone` }],
    externals: [{ id: `site.com`, hrefs: [`https://site.com`] }],
    edges: [
      { fromId: `linked`, toId: `site.com`, hrefs: [`https://site.com`] },
    ],
  })

  const layout = layoutGraph(graph)

  expect(findPositionsOutside(layout)).toStrictEqual([])
})

test(`the layout is deterministic`, () => {
  const graph = createFannedGraph()

  const layout1 = layoutGraph(graph)
  const layout2 = layoutGraph(graph)

  expect(layout1).toStrictEqual(layout2)
})
