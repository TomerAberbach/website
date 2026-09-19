import { expect, test, vi } from 'vitest'
import { computeGraphFacts } from './graph-facts.ts'
import type { GraphFact } from './graph-facts.ts'
import type { Edge, Graph, Vertex } from './graph.ts'

// Importing the graph module eagerly builds the graph from the posts on disk.
vi.mock(`./ordered.ts`, () => ({
  getOrderedPosts: () => Promise.resolve(new Map()),
}))

type VertexSpec = {
  id: string
  tags?: string[]
  external?: boolean
}

type EdgeSpec = {
  from: string
  to: string
  tags?: string[]
  hrefs?: string[]
}

const buildGraph = ({
  vertices,
  edges = [],
}: {
  vertices: VertexSpec[]
  edges?: EdgeSpec[]
}): Pick<Graph, `vertices` | `edges`> => ({
  vertices: new Map(
    vertices.map(({ id, tags = [], external = false }): [string, Vertex] => [
      id,
      external
        ? {
            type: `external`,
            id,
            label: id,
            tags: new Set(tags),
            hrefToTags: new Map(),
          }
        : {
            type: `internal`,
            id,
            label: id.toUpperCase(),
            tags: new Set(tags),
            href: `/${id}`,
          },
    ]),
  ),
  edges: new Map(
    edges.map(
      ({ from, to, tags = [], hrefs = [`${from}->${to}`] }): [string, Edge] => [
        `${from} ${to}`,
        { fromId: from, toId: to, tags: new Set(tags), hrefs: new Set(hrefs) },
      ],
    ),
  ),
})

const plain = (fact: GraphFact): string =>
  fact.text
    .map(segment => (typeof segment === `string` ? segment : segment.text))
    .join(``)

const plainFacts = (graph: Pick<Graph, `vertices` | `edges`>): string[] =>
  computeGraphFacts(graph).map(plain)

const findFact = (
  graph: Pick<Graph, `vertices` | `edges`>,
  substring: string,
): GraphFact => {
  const fact = computeGraphFacts(graph).find(fact =>
    plain(fact).includes(substring),
  )
  expect(
    fact,
    `expected a fact containing ${JSON.stringify(substring)}`,
  ).toBeDefined()
  return fact!
}

const vertexIdsIn = (fact: GraphFact): string[] =>
  fact.text.flatMap(segment =>
    typeof segment !== `string` && `vertexId` in segment
      ? [segment.vertexId]
      : [],
  )

const hrefsIn = (fact: GraphFact): string[] =>
  fact.text.flatMap(segment =>
    typeof segment !== `string` && `href` in segment ? [segment.href] : [],
  )

// A -> b -> c, where a is tagged x and y, b is tagged y, and c is tagged z.
// The edge from b to c has two hrefs.
const path = buildGraph({
  vertices: [
    { id: `a`, tags: [`x`, `y`] },
    { id: `b`, tags: [`y`] },
    { id: `c`, tags: [`z`] },
  ],
  edges: [
    { from: `a`, to: `b`, tags: [`x`, `y`] },
    { from: `b`, to: `c`, tags: [`y`], hrefs: [`h1`, `h2`] },
  ],
})

const triangle = buildGraph({
  vertices: [
    { id: `a`, tags: [`x`] },
    { id: `b`, tags: [`x`] },
    { id: `c`, tags: [`x`] },
  ],
  edges: [
    { from: `a`, to: `b`, tags: [`x`] },
    { from: `b`, to: `c`, tags: [`x`] },
    { from: `c`, to: `a`, tags: [`x`] },
  ],
})

// Two components, a bidirectional pair, and an isolated vertex.
const split = buildGraph({
  vertices: [{ id: `a` }, { id: `b` }, { id: `c` }, { id: `d` }, { id: `e` }],
  edges: [
    { from: `a`, to: `b` },
    { from: `b`, to: `a` },
    { from: `c`, to: `d` },
  ],
})

const single = buildGraph({ vertices: [{ id: `a`, tags: [`x`] }] })

const withExternal = buildGraph({
  vertices: [
    { id: `a`, tags: [`x`] },
    { id: `b`, tags: [`y`] },
    { id: `example.com`, tags: [`x`, `y`], external: true },
  ],
  edges: [
    { from: `a`, to: `example.com`, tags: [`x`] },
    { from: `b`, to: `example.com`, tags: [`y`] },
  ],
})

test.each([
  {
    name: `a path`,
    graph: path,
    facts: [
      `The graph has order 3 and size 2.`,
      `The graph has 3 internal and 0 external vertices.`,
    ],
  },
  {
    name: `a graph with an external vertex`,
    graph: withExternal,
    facts: [
      `The graph has order 3 and size 2.`,
      `The graph has 2 internal and 1 external vertices.`,
    ],
  },
])(`order, size, and vertex type facts for $name`, ({ graph, facts }) => {
  expect(plainFacts(graph)).toEqual(expect.arrayContaining(facts))
})

test(`terms in facts link to wikipedia`, () => {
  const fact = findFact(path, `has order`)

  expect(hrefsIn(fact)).toStrictEqual([
    `https://en.wikipedia.org/wiki/Order_(graph_theory)`,
    `https://en.wikipedia.org/wiki/Size_(graph_theory)`,
  ])
})

test.each([
  {
    name: `a path`,
    graph: path,
    facts: [
      `B has the highest degree at 2.`,
      `A and B have the highest out-degree at 1.`,
      `B and C have the highest in-degree at 1.`,
      `The graph's average degree is 1.33.`,
    ],
  },
  {
    name: `a single vertex`,
    graph: single,
    facts: [
      `A has the highest degree at 0.`,
      `A has the highest out-degree at 0.`,
      `A has the highest in-degree at 0.`,
      `The graph's average degree is 0.00.`,
    ],
  },
  {
    name: `a triangle`,
    graph: triangle,
    facts: [
      `A, B, and C have the highest degree at 2.`,
      `The graph's average degree is 2.00.`,
    ],
  },
])(`degree facts for $name`, ({ graph, facts }) => {
  expect(plainFacts(graph)).toEqual(expect.arrayContaining(facts))
})

test(`vertices in facts link to their ids`, () => {
  const fact = findFact(path, `highest out-degree`)

  expect(vertexIdsIn(fact)).toStrictEqual([`a`, `b`])
})

test.each([
  {
    name: `a connected graph`,
    graph: path,
    facts: [
      `The graph has 1 weak component.`,
      `The largest weak component has 3 vertices.`,
      `The graph has 0 isolated vertices.`,
    ],
  },
  {
    name: `a split graph`,
    graph: split,
    facts: [
      `The graph has 2 weak components.`,
      `The largest weak component has 2 vertices.`,
      `The graph has 1 isolated vertex.`,
    ],
  },
  {
    name: `a single vertex`,
    graph: single,
    facts: [
      `The graph has 0 weak components.`,
      `The graph has 1 isolated vertex.`,
    ],
  },
])(`component facts for $name`, ({ graph, facts }) => {
  expect(plainFacts(graph)).toEqual(expect.arrayContaining(facts))
})

test.each([
  { name: `a path`, graph: path, density: `33.3%` },
  { name: `a triangle`, graph: triangle, density: `50.0%` },
  { name: `a split graph`, graph: split, density: `15.0%` },
])(`density of $name is $density`, ({ graph, density }) => {
  expect(plainFacts(graph)).toContain(`The graph density is ${density}.`)
})

test(`density is omitted for fewer than two vertices`, () => {
  expect(plainFacts(single)).not.toContainEqual(
    expect.stringContaining(`density`),
  )
})

test.each([
  {
    name: `a path`,
    graph: path,
    facts: [
      `The y tag is the most popular with 2 internal vertices.`,
      `The y tag has the most edges at 2.`,
      `A has the most tags at 2.`,
      `The most common tag pair is x and y, appearing together on 1 internal vertex.`,
      `The y tag has the highest external vertex ratio at 0%.`,
      `The y tag's induced subgraph has the highest diameter at 2.`,
    ],
  },
  {
    name: `a graph with an external vertex`,
    graph: withExternal,
    facts: [
      `The x and y tags are the most popular with 1 internal vertex each.`,
      `example.com has the most tags at 2.`,
      `The x tag has the highest external vertex ratio at 50%.`,
    ],
  },
])(`tag facts for $name`, ({ graph, facts }) => {
  expect(plainFacts(graph)).toEqual(expect.arrayContaining(facts))
})

test.each([
  { substring: `most popular`, href: `/?tags=y` },
  { substring: `most common tag pair`, href: `/?tags=x,y&op=and` },
])(
  `tags in the fact containing $substring link to the tag filter`,
  ({ substring, href }) => {
    const fact = findFact(path, substring)

    expect(hrefsIn(fact)).toContain(href)
  },
)

test.each([
  `most edges`,
  `tag pair`,
  `external vertex ratio`,
  `induced subgraph`,
  `diameter`,
  `radius`,
  `path length`,
  `clustering`,
  `heaviest`,
  `average edge weight`,
])(`the fact containing %j is omitted for a graph without edges`, substring => {
  expect(plainFacts(single)).not.toContainEqual(
    expect.stringContaining(substring),
  )
})

test.each([
  { name: `a path`, graph: path, pairs: `0 bidirectional edge pairs` },
  { name: `a split graph`, graph: split, pairs: `1 bidirectional edge pair` },
])(`bidirectional pair fact for $name`, ({ graph, pairs }) => {
  expect(plainFacts(graph)).toContain(`The graph has ${pairs}.`)
})

test.each([
  {
    name: `a path`,
    graph: path,
    facts: [
      `The largest weak component's diameter is 2.`,
      `The largest weak component's radius is 1 and its most connected center vertex is B.`,
      `The largest weak component's average path length is 1.33.`,
      `The average clustering coefficient is 0.000.`,
      `The graph has 2 bridges.`,
    ],
  },
  {
    name: `a triangle`,
    graph: triangle,
    facts: [
      `The largest weak component's diameter is 1.`,
      `The largest weak component's average path length is 1.00.`,
      `The average clustering coefficient is 1.000.`,
      `The graph has 0 bridges.`,
    ],
  },
  {
    name: `a split graph`,
    graph: split,
    facts: [
      `The largest weak component's diameter is 1.`,
      `The graph has 2 bridges.`,
    ],
  },
])(`distance facts for $name`, ({ graph, facts }) => {
  expect(plainFacts(graph)).toEqual(expect.arrayContaining(facts))
})

test(`radius fact lists every center when they tie on degree`, () => {
  const fact = findFact(triangle, `radius`)

  expect(vertexIdsIn(fact).sort()).toStrictEqual([`a`, `b`, `c`])
  expect(plain(fact)).toContain(`most connected center vertices are`)
})

test(`edge weight facts use the number of hrefs per edge`, () => {
  expect(plainFacts(path)).toEqual(
    expect.arrayContaining([
      `The heaviest edge goes from B to C with weight 2.`,
      `The average edge weight is 1.50.`,
      `B has the highest total edge weight at 3.`,
      `1 of 2 edges have weight > 1.`,
    ]),
  )
})

test(`heaviest edge fact links both endpoints`, () => {
  const fact = findFact(path, `heaviest edge`)

  expect(vertexIdsIn(fact)).toStrictEqual([`b`, `c`])
})

test(`counting facts for an empty graph report zeros`, () => {
  expect(plainFacts(buildGraph({ vertices: [] }))).toEqual(
    expect.arrayContaining([
      `The graph has order 0 and size 0.`,
      `The graph has 0 weak components.`,
      `The graph has 0 isolated vertices.`,
      `The graph has 0 bridges.`,
      `0 of 0 edges have weight > 1.`,
    ]),
  )
})
