import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import GraphFactsCarousel from './graph-facts-carousel.tsx'
import GraphWidget from './graph-widget.tsx'
import { PostSwitcher, useSelectedPostId } from './post-switcher.tsx'
import useHydrated from '~/hooks/use-hydrated.ts'
import type { Graph } from '~/services/graph.server.ts'
import {
  HOME_ELEMENT_ID,
  HOME_GRAPH_ELEMENT_ID,
  HOME_PRELOAD_STYLE_ID,
} from '~/services/home-state.ts'
import type { HomeData } from '~/services/home-state.ts'

/** The interactive part of the home page: the post switcher, facts, and graph. */
const HomeWidgets = ({ data, graph }: { data: HomeData; graph: Graph }) => {
  const [selectedPostId, setSelectedPostId] = useSelectedPostId(data)

  // A vertex selected from the facts, which stands until the post changes.
  const [vertexSelection, setVertexSelection] = useState<{
    postId: string
    vertexId: string
  } | null>(null)
  const selectedVertexId =
    vertexSelection?.postId === selectedPostId
      ? vertexSelection.vertexId
      : selectedPostId
  const graphRef = useRef<HTMLDivElement>(null)

  const selectVertex = useCallback(
    (vertexId: string) => {
      if (data.posts.some(post => post.id === vertexId)) {
        setSelectedPostId(vertexId)
        setVertexSelection(null)
      } else {
        setVertexSelection({ postId: selectedPostId, vertexId })
      }
      graphRef.current?.scrollIntoView({ behavior: `smooth`, block: `center` })
    },
    [data.posts, selectedPostId, setSelectedPostId],
  )

  // The stylesheet from the preload script painted the URL's state before
  // hydration. This render shows the same state, so the stylesheet goes.
  const hydrated = useHydrated()
  useLayoutEffect(() => {
    if (hydrated) {
      document.getElementById(HOME_PRELOAD_STYLE_ID)?.remove()
    }
  }, [hydrated])

  return (
    <div
      id={HOME_ELEMENT_ID}
      className='flex flex-1 flex-col gap-8 sm:gap-12 md:gap-16'
    >
      <div className='flex flex-col items-center gap-3'>
        <PostSwitcher
          selectedPostId={selectedPostId}
          setSelectedPostId={setSelectedPostId}
          data={data}
          graph={graph}
          graphId={HOME_GRAPH_ELEMENT_ID}
        />
        <GraphFactsCarousel facts={graph.facts} onSelectVertex={selectVertex} />
      </div>
      <div ref={graphRef}>
        <GraphWidget
          id={HOME_GRAPH_ELEMENT_ID}
          graph={graph}
          selectedVertexId={selectedVertexId}
        />
      </div>
    </div>
  )
}

export default HomeWidgets
