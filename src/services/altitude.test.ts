import { expect, test } from 'vitest'
import { computeAltitudes, getEdgeAltitude } from './altitude.ts'

// A chain from the selected vertex, and a vertex with no edges.
const VERTEX_IDS = [`selected`, `near`, `far`, `farther`, `farthest`, `alone`]
const EDGES: [string, string][] = [
  [`selected`, `near`],
  [`near`, `far`],
  [`far`, `farther`],
  [`farther`, `farthest`],
]

test(`altitude falls with the number of edges from the selected vertex`, () => {
  const altitudes = computeAltitudes({
    vertexIds: VERTEX_IDS,
    edges: EDGES,
    selectedVertexId: `selected`,
  })

  expect(altitudes.get(`selected`)).toBe(1)
  expect(altitudes.get(`near`)).toBeLessThan(altitudes.get(`selected`)!)
  expect(altitudes.get(`far`)).toBeLessThan(altitudes.get(`near`)!)
})

test(`altitude stops falling at a floor shared with unconnected vertices`, () => {
  const altitudes = computeAltitudes({
    vertexIds: VERTEX_IDS,
    edges: EDGES,
    selectedVertexId: `selected`,
  })

  expect(altitudes.get(`farthest`)).toBe(altitudes.get(`farther`))
  expect(altitudes.get(`alone`)).toBe(altitudes.get(`farthest`))
  expect(altitudes.get(`alone`)).toBeGreaterThan(0)
})

test(`edges follow the direction of the graph in neither direction`, () => {
  const altitudes = computeAltitudes({
    vertexIds: VERTEX_IDS,
    edges: EDGES,
    selectedVertexId: `far`,
  })

  expect(altitudes.get(`near`)).toBe(altitudes.get(`farther`))
})

test(`an edge is midway between its endpoints`, () => {
  const altitudes = computeAltitudes({
    vertexIds: VERTEX_IDS,
    edges: EDGES,
    selectedVertexId: `selected`,
  })

  expect(getEdgeAltitude(altitudes, [`selected`, `near`])).toBe(
    (altitudes.get(`selected`)! + altitudes.get(`near`)!) / 2,
  )
})
