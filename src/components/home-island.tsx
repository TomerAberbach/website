import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/compat'
import GraphFactsCarousel from './graph-facts-carousel.tsx'
import GraphWidget from './graph-widget.tsx'
import { PostSwitcher, useSelectedPostId } from './post-switcher.tsx'
import type { GraphJson } from '~/lib/graph-json.ts'
import { graphFromJson } from '~/lib/graph-json.ts'

// The single hydrated island on the home page. Astro server-renders it (so the
// graph is visible and clickable before hydration) and then hydrates it for
// panzoom, filtering, and the post switcher/carousel.
const HomeIsland = ({
  graph: graphJson,
  postIds,
  tags,
}: {
  graph: GraphJson
  postIds: string[]
  tags: string[]
}) => {
  const graph = useMemo(() => graphFromJson(graphJson), [graphJson])
  const postIdSet = useMemo(() => new Set(postIds), [postIds])
  const tagSet = useMemo(() => new Set(tags), [tags])

  const graphId = `graph`
  const [selectedPostId, setSelectedPostId] = useSelectedPostId({
    postIds: postIdSet,
    tags: tagSet,
    graph,
  })

  const [selectedVertexId, setSelectedVertexId] = useState(selectedPostId)
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedVertexId(selectedPostId)
  }, [selectedPostId])

  // Shuffle the facts only after mount so the server render is deterministic and
  // hydration matches (`useId` ids stay stable).
  const [facts, setFacts] = useState(graph.facts)
  useEffect(() => {
    setFacts(shuffle([...graph.facts]))
  }, [graph])

  const selectVertex = useCallback(
    (vertexId: string) => {
      setSelectedVertexId(vertexId)
      if (postIdSet.has(vertexId)) {
        setSelectedPostId(vertexId)
      }
      graphRef.current?.scrollIntoView({ behavior: `smooth`, block: `center` })
    },
    [postIdSet, setSelectedPostId],
  )

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-12 md:gap-16'>
      <div className='flex flex-col items-center gap-3'>
        <PostSwitcher
          selectedPostId={selectedPostId}
          setSelectedPostId={setSelectedPostId}
          tags={tagSet}
          graph={graph}
          graphId={graphId}
        />
        <GraphFactsCarousel facts={facts} onSelectVertex={selectVertex} />
      </div>
      <div ref={graphRef}>
        <GraphWidget
          id={graphId}
          graph={graph}
          selectedVertexId={selectedVertexId}
        />
      </div>
    </div>
  )
}

const shuffle = <T,>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j]!, array[i]!]
  }
  return array
}

export default HomeIsland
