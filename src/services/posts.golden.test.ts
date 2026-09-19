import { map, pipe, reduce, toArray, values } from 'lfi'
import { expect, test } from 'vitest'
import { getOrderedPosts } from './ordered.ts'

const excludeHtml = ({ html: _, ...post }: { html: string }) => post

// Loading the real posts renders mermaid diagrams in a browser and fetches
// embeds over the network, so this runs only when asked for.
test.skipIf(!process.env.GOLDEN)(
  `the metadata derived from the real posts is unchanged`,
  { timeout: 120_000 },
  async () => {
    const posts = await getOrderedPosts()

    const metadata = pipe(
      values(posts),
      map(post => (post.type === `markdown` ? excludeHtml(post) : post)),
      reduce(toArray()),
    )
    expect(metadata).toMatchSnapshot()
  },
)
