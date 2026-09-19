import clsx from 'clsx'
import { useCallback } from 'react'
import { Link } from './link.tsx'
import ShrinkWrap from './shrink-wrap.tsx'
import { TagsFilterForm } from './tags-filter-form.tsx'
import { useSelectedTags } from './tags-listbox.tsx'
import Tooltip from './tooltip.tsx'
import useHydrated from '~/hooks/use-hydrated.ts'
import useSearchParams from '~/hooks/use-search-params.ts'
import type { Graph, InternalVertex } from '~/services/graph.ts'
import {
  getAdjacentPostId,
  getFirstPostId,
  parseSelectedPostId,
} from '~/services/home-state.ts'
import type { HomeData } from '~/services/home-state.ts'

export const PostSwitcher = ({
  selectedPostId,
  setSelectedPostId,
  data,
  graph,
  graphId,
}: {
  selectedPostId: string
  setSelectedPostId: (newSelectedPostId: string) => void
  data: HomeData
  graph: Graph
  graphId: string
}) => {
  const vertex = graph.vertices.get(selectedPostId) as InternalVertex
  const [selectedTags] = useSelectedTags(data.tags)

  const previousPostId = getAdjacentPostId(
    data.posts,
    selectedPostId,
    `previous`,
    selectedTags,
  )
  const selectPreviousPost = useCallback(() => {
    if (previousPostId) {
      setSelectedPostId(previousPostId)
    }
  }, [previousPostId, setSelectedPostId])

  const nextPostId = getAdjacentPostId(
    data.posts,
    selectedPostId,
    `next`,
    selectedTags,
  )
  const selectNextPost = useCallback(() => {
    if (nextPostId) {
      setSelectedPostId(nextPostId)
    }
  }, [nextPostId, setSelectedPostId])

  const hydrated = useHydrated()

  return (
    <div className='h-39'>
      <div className='flex h-full -translate-y-6 items-center justify-between gap-3'>
        <div
          data-home-adjacent='previous'
          className='ml-auto flex items-center has-disabled:invisible'
        >
          <Tooltip content='Previous post'>
            {tooltipId => (
              <button
                // Prevent flash of disappearing focus ring when clicking.
                key={previousPostId}
                type='button'
                onClick={selectPreviousPost}
                aria-labelledby={tooltipId}
                disabled={!previousPostId}
                className='focus-ring cursor-pointer hover:ring-3'
              >
                <ChevronLeft />
              </button>
            )}
          </Tooltip>
        </div>
        <div className='relative flex w-60 flex-col items-center gap-3'>
          {hydrated ? (
            <Link href={vertex.href} className={TITLE_CLASS_NAME}>
              <ShrinkWrap>{vertex.label}</ShrinkWrap>
            </Link>
          ) : (
            // Before hydration every title is in the document, so that the
            // stylesheet from the preload script can show the selected one.
            data.posts.map(({ id }) => {
              const { href, label } = graph.vertices.get(id) as InternalVertex
              return (
                <Link
                  key={id}
                  data-home-post-title={id}
                  href={href}
                  className={clsx(
                    TITLE_CLASS_NAME,
                    id !== selectedPostId && `hidden`,
                  )}
                >
                  {label}
                </Link>
              )
            })
          )}
          <div className='absolute -bottom-3 translate-y-full'>
            <TagsFilterForm targetId={graphId} tags={data.tags} />
          </div>
        </div>
        <div
          data-home-adjacent='next'
          className='mr-auto flex items-center has-disabled:invisible'
        >
          <Tooltip content='Next post'>
            {tooltipId => (
              <button
                // Prevent flash of disappearing focus ring when clicking.
                key={nextPostId}
                type='button'
                onClick={selectNextPost}
                aria-labelledby={tooltipId}
                disabled={!nextPostId}
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

const TITLE_CLASS_NAME = `max-w-full text-center font-medium text-balance text-gray-700 hover:ring-3`

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
  posts,
  tags,
}: HomeData): [string, (newSelectedPostId: string) => void] => {
  const [selectedTags] = useSelectedTags(tags)
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedPostId = parseSelectedPostId(searchParams, posts, selectedTags)
  const setSelectedPostId = useCallback(
    (newSelectedPostId: string) => {
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.set(`post`, newSelectedPostId)

      const firstPostId = getFirstPostId(posts, selectedTags)
      newSelectedPostId = parseSelectedPostId(
        newSearchParams,
        posts,
        selectedTags,
      )
      if (newSelectedPostId === firstPostId) {
        newSearchParams.delete(`post`)
      }

      setSearchParams(newSearchParams)
    },
    [searchParams, setSearchParams, posts, selectedTags],
  )

  return [selectedPostId, setSelectedPostId]
}
