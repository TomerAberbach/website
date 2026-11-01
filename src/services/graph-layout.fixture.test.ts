import fs from 'node:fs'
import superjson from 'superjson'
import { test } from 'vitest'
import { getLastViolations } from './graph-core-layout.ts'
import { layoutGraph } from './graph-layout.ts'
import type { Edge, Vertex } from './graph.ts'

// A fixture of the real graph's vertices and edges, written with superjson,
// so the layout can be tuned against it without rendering the posts.
const FIXTURE = process.env.GRAPH_FIXTURE

// eslint-disable-next-line vitest/expect-expect -- Reports the violations for tuning instead of asserting
test.skipIf(!FIXTURE)(`the real graph's layout violations`, () => {
  const { vertices, edges } = superjson.parse<{
    vertices: Map<string, Vertex>
    edges: Map<string, Edge>
  }>(fs.readFileSync(FIXTURE!, `utf8`))

  const start = Date.now()
  const { boundingBox } = layoutGraph({ vertices, edges })

  process.stderr.write(
    `RESULT ${JSON.stringify({
      ...getLastViolations(),
      box: [Math.round(boundingBox.width), Math.round(boundingBox.height)],
      ms: Date.now() - start,
    })}\n`,
  )
})
