import { expect, test } from 'vitest'
import { placeEdgeLabels } from './edge-labels.ts'
import { createGraph } from '~/test/graph.ts'

const HREFS = [`https://site.com/one`, `https://site.com/two`]

test(`a label goes at the midpoint when nothing is near it`, () => {
  const graph = createGraph({
    posts: [{ id: `a` }],
    externals: [{ id: `site.com`, hrefs: HREFS }],
    edges: [{ fromId: `a`, toId: `site.com`, hrefs: HREFS }],
  })

  const fractions = placeEdgeLabels(graph)

  expect(fractions.get(`a site.com`)).toBe(0.5)
})

test(`a label moves off a vertex sitting on the middle of its edge`, () => {
  const graph = createGraph({
    posts: [{ id: `a` }, { id: `b` }, { id: `c` }],
    edges: [{ fromId: `a`, toId: `c`, hrefs: HREFS }],
  })
  // The test graph places vertices on a diagonal, so `b` is on the middle of
  // the edge from `a` to `c`.

  const fractions = placeEdgeLabels(graph)

  expect(Math.abs(fractions.get(`a c`)! - 0.5)).toBeGreaterThanOrEqual(0.2)
})
