import { any, filter, first, get, or, pipe } from 'lfi'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { setHas } from 'ts-extras'
import { Link } from './link.tsx'
import Tooltip from './tooltip.tsx'
import ShrinkWrap from './shrink-wrap.tsx'
import { TagsFilterForm } from './tags-filter-form.tsx'
import { useSelectedTags } from './tags-listbox.tsx'
import type { Graph, InternalVertex } from '~/services/graph.server.ts'

export const PostSwitcher = ({
  selectedPostId,
  setSelectedPostId,
  tags,
  graph,
  graphId,
}: {
  selectedPostId: string
  setSelectedPostId: (newSelectedPostId: string) => void
  tags: Set<string>
  graph: Graph
  graphId: string
}) => {
  const vertex = graph.vertices.get(selectedPostId) as InternalVertex

  const previousVertex = useAdjacentVertex({
    vertex,
    direction: `previous`,
    tags,
    graph,
  })
  const selectPreviousPost = useCallback(() => {
    if (previousVertex) {
      setSelectedPostId(previousVertex.id)
    }
  }, [previousVertex, setSelectedPostId])

  const nextVertex = useAdjacentVertex({
    vertex,
    direction: `next`,
    tags,
    graph,
  })
  const selectNextPost = useCallback(() => {
    if (nextVertex) {
      setSelectedPostId(nextVertex.id)
    }
  }, [nextVertex, setSelectedPostId])

  return (
    <div className='h-39'>
      <div className='flex h-full -translate-y-6 items-center justify-between gap-3'>
        <div className='ml-auto flex items-center has-[:disabled]:invisible'>
          <Tooltip content='Previous post'>
            {tooltipId => (
              <button
                // Prevent flash of disappearing focus ring when clicking.
                key={previousVertex?.id}
                type='button'
                onClick={selectPreviousPost}
                aria-labelledby={tooltipId}
                disabled={!previousVertex}
                className='focus-ring cursor-pointer hover:ring-3'
              >
                <ChevronLeft />
              </button>
            )}
          </Tooltip>
        </div>
        <div className='relative flex w-60 flex-col items-center gap-3'>
          <Link
            href={vertex.href}
            reloadDocument={vertex.reloadDocument}
            className='max-w-full text-center font-medium text-balance text-gray-700 hover:ring-3'
          >
            <ShrinkWrap>{vertex.label}</ShrinkWrap>
          </Link>
          <div className='absolute -bottom-3 translate-y-full'>
            <TagsFilterForm targetId={graphId} tags={tags} />
          </div>
        </div>
        <div className='mr-auto flex items-center has-[:disabled]:invisible'>
          <Tooltip content='Next post'>
            {tooltipId => (
              <button
                // Prevent flash of disappearing focus ring when clicking.
                key={nextVertex?.id}
                type='button'
                onClick={selectNextPost}
                aria-labelledby={tooltipId}
                disabled={!nextVertex}
                className='focus-ring cursor-pointer hover:ring-3'
              >
                <ChevronRight />
              </button>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

const useAdjacentVertex = ({
  vertex,
  direction,
  tags,
  graph,
}: {
  vertex: InternalVertex
  direction: `previous` | `next`
  tags: Set<string>
  graph: Graph
}): InternalVertex | undefined => {
  const [selectedTags] = useSelectedTags(tags)
  const selectedTagsSet = new Set(selectedTags)

  while (true) {
    const adjacentVertexId = vertex[direction]
    if (!adjacentVertexId) {
      return undefined
    }

    const adjacentVertex = graph.vertices.get(adjacentVertexId)
    if (!adjacentVertexId) {
      return undefined
    }

    vertex = adjacentVertex as InternalVertex
    if (
      selectedTagsSet.size === 0 ||
      pipe(
        vertex.tags,
        any(tag => selectedTagsSet.has(tag)),
      )
    ) {
      return vertex
    }
  }
}

const ChevronLeft = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className='size-6'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M15.75 19.5 8.25 12l7.5-7.5'
    />
  </svg>
)

const ChevronRight = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className='size-6'
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='m8.25 4.5 7.5 7.5-7.5 7.5'
    />
  </svg>
)

export const useSelectedPostId = ({
  postIds,
  tags,
  graph,
}: {
  postIds: Set<string>
  tags: Set<string>

  graph: Graph
}): [string, (newSelectedPostId: string) => void] => {
  const [selectedTags] = useSelectedTags(tags)
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedTagsSet = new Set(selectedTags)
  const firstPostId = pipe(
    postIds,
    filter(postId =>
      pipe(
        graph.vertices.get(postId)!.tags,
        any(tag => selectedTagsSet.has(tag)),
      ),
    ),
    first,
    or(() => get(first(postIds))),
  )
  const sanitizePostId = useCallback(
    (postId: string | null) => (setHas(postIds, postId) ? postId : firstPostId),
    [postIds, firstPostId],
  )

  const selectedPostId = sanitizePostId(searchParams.get(`post`))
  const setSelectedPostId = useCallback(
    (newSelectedPostId: string) => {
      const newSearchParams = new URLSearchParams(searchParams)

      newSelectedPostId = sanitizePostId(newSelectedPostId)
      if (newSelectedPostId === firstPostId) {
        newSearchParams.delete(`post`)
      } else {
        newSearchParams.set(`post`, newSelectedPostId)
      }

      setSearchParams(newSearchParams, {
        replace: true,
        preventScrollReset: true,
      })
    },
    [searchParams, setSearchParams, sanitizePostId, firstPostId],
  )

  return [selectedPostId, setSelectedPostId]
}
