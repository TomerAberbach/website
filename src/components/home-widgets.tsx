import { useCallback, useEffect, useId, useRef, useState } from 'react'
import GraphFactsCarousel from './graph-facts-carousel.tsx'
import GraphWidget from './graph-widget.tsx'
import { PostSwitcher, useSelectedPostId } from './post-switcher.tsx'
import type { Graph } from '~/services/graph.server.ts'

/** The interactive part of the home page: the post switcher, facts, and graph. */
const HomeWidgets = ({
  postIds,
  tags,
  graph,
}: {
  postIds: Set<string>
  tags: Set<string>
  graph: Graph
}) => {
  const graphId = useId()
  const [selectedPostId, setSelectedPostId] = useSelectedPostId({
    postIds,
    tags,
    graph,
  })

  const [selectedVertexId, setSelectedVertexId] = useState(selectedPostId)
  const graphRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedVertexId(selectedPostId)
  }, [selectedPostId])

  const selectVertex = useCallback(
    (vertexId: string) => {
      setSelectedVertexId(vertexId)
      if (postIds.has(vertexId)) {
        setSelectedPostId(vertexId)
      }
      graphRef.current?.scrollIntoView({ behavior: `smooth`, block: `center` })
    },
    [postIds, setSelectedPostId],
  )

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-12 md:gap-16'>
      <div className='flex flex-col items-center gap-3'>
        <PostSwitcher
          selectedPostId={selectedPostId}
          setSelectedPostId={setSelectedPostId}
          tags={tags}
          graph={graph}
          graphId={graphId}
        />
        <GraphFactsCarousel facts={graph.facts} onSelectVertex={selectVertex} />
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

export default HomeWidgets
