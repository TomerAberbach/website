import { expect, test, vi } from 'vitest'
import { findConnectedComponents, getGraph } from './graph.server.ts'
import type {
  Edge,
  ExternalVertex,
  GraphLayout,
  InternalVertex,
  Position,
} from './graph.server.ts'
import type { Post } from './post.server.ts'

// Posts are read from the filesystem and rendered, so they are replaced with
// fixtures.
vi.mock(`./ordered.server.ts`, () => ({
  getOrderedPosts: () => Promise.resolve(posts),
}))

const post = ({
  id,
  tags,
  references,
}: {
  id: string
  tags: string[]
  references: Record<string, string[]>
}): Post => ({
  id,
  type: `markdown`,
  title: `Title of ${id}`,
  tags: new Set(tags),
  dates: { published: new Date(0) },
  references: new Map(
    Object.entries(references).map(([reference, hrefs]) => [
      reference,
      new Set(hrefs),
    ]),
  ),
  referencedBy: new Map(),
  minutesToRead: 1,
  html: ``,
  description: ``,
  features: new Set(),
})

const hrefPostUrl = `https://elsewhere.com/article`
const hrefPost: Post = {
  id: hrefPostUrl,
  type: `href`,
  href: hrefPostUrl,
  title: `Elsewhere article`,
  tags: new Set([`elsewhere`]),
  dates: { published: new Date(0) },
  references: new Map(),
  referencedBy: new Map(),
}

const posts = new Map<string, Post>([
  [
    `newest`,
    post({
      id: `newest`,
      tags: [`a`, `b`],
      references: {
        'example.com': [`https://example.com/two`, `https://example.com/one`],
        [`elsewhere.com`]: [hrefPostUrl],
      },
    }),
  ],
  [
    `middle`,
    post({
      id: `middle`,
      tags: [`b`],
      references: { 'example.com': [`https://example.com/one`] },
    }),
  ],
  [hrefPostUrl, hrefPost],
])

test(`every post becomes an internal vertex`, async () => {
  const { vertices } = await getGraph()

  expect(vertices.get(`newest`)).toMatchObject({
    type: `internal`,
    label: `Title of newest`,
    tags: new Set([`a`, `b`]),
    href: `/newest`,
    reloadDocument: false,
  })
  expect(vertices.get(hrefPostUrl)).toMatchObject({
    type: `internal`,
    label: `Elsewhere article`,
    href: hrefPostUrl,
    reloadDocument: true,
  })
})

test(`next points to the newer post and previous to the older one`, async () => {
  const { vertices } = await getGraph()

  expect(vertices.get(`newest`)).toMatchObject<Partial<InternalVertex>>({
    previous: `middle`,
  })
  expect(vertices.get(`newest`)).not.toHaveProperty(`next`)
  expect(vertices.get(`middle`)).toMatchObject<Partial<InternalVertex>>({
    previous: hrefPostUrl,
    next: `newest`,
  })
  expect(vertices.get(hrefPostUrl)).toMatchObject<Partial<InternalVertex>>({
    next: `middle`,
  })
  expect(vertices.get(hrefPostUrl)).not.toHaveProperty(`previous`)
})

test(`a reference to an existing vertex becomes an edge to that vertex`, async () => {
  const { edges } = await getGraph()

  expect(edges.get(`newest ${hrefPostUrl}`)).toStrictEqual<Edge>({
    fromId: `newest`,
    toId: hrefPostUrl,
    tags: new Set([`a`, `b`]),
    hrefs: new Set([hrefPostUrl]),
  })
})

test(`other references become edges to an external vertex`, async () => {
  const { vertices, edges } = await getGraph()

  expect(edges.get(`newest example.com`)).toStrictEqual<Edge>({
    fromId: `newest`,
    toId: `example.com`,
    tags: new Set([`a`, `b`]),
    hrefs: new Set([`https://example.com/two`, `https://example.com/one`]),
  })
  expect(vertices.get(`example.com`)).toMatchObject({
    type: `external`,
    label: `example.com`,
  })
})

test(`an external vertex collects the tags of every post referencing it`, async () => {
  const { vertices } = await getGraph()

  expect(vertices.get(`example.com`)!.tags).toStrictEqual(new Set([`a`, `b`]))
})

test(`an external vertex maps each href to the tags of posts using it, sorted by href`, async () => {
  const { vertices } = await getGraph()

  const { hrefToTags } = vertices.get(`example.com`) as ExternalVertex
  expect([...hrefToTags]).toStrictEqual([
    [`https://example.com/one`, new Set([`a`, `b`])],
    [`https://example.com/two`, new Set([`a`, `b`])],
  ])
})

test(`the layout positions every vertex inside the bounding box`, async () => {
  const {
    vertices,
    layout: { positions, boundingBox },
  } = await getGraph()

  expect([...positions.keys()].sort()).toStrictEqual(
    [...vertices.keys()].sort(),
  )
  expect(positionsOutside(positions, boundingBox)).toStrictEqual([])
})

const positionsOutside = (
  positions: GraphLayout[`positions`],
  { width, height }: GraphLayout[`boundingBox`],
): Position[] =>
  [...positions.values()].filter(
    ({ x, y }) =>
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      y < 0 ||
      x > width ||
      y > height,
  )

test(`the graph includes facts`, async () => {
  const { facts } = await getGraph()

  expect(facts.length).toBeGreaterThan(0)
})

const edge = (fromId: string, toId: string): [string, Edge] => [
  `${fromId} ${toId}`,
  { fromId, toId, tags: new Set(), hrefs: new Set() },
]

test(`connected components ignore edge direction`, () => {
  const edges = new Map([edge(`a`, `b`), edge(`c`, `b`), edge(`d`, `e`)])

  const components = findConnectedComponents(edges)

  expect(components.map(component => [...component].sort())).toStrictEqual(
    expect.arrayContaining([
      [`a`, `b`, `c`],
      [`d`, `e`],
    ]),
  )
  expect(components).toHaveLength(2)
})
