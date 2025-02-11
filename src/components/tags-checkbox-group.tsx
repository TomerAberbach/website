import {
  entries,
  filter,
  flatMap,
  keys,
  map,
  pipe,
  reduce,
  toArray,
  toObject,
  toSet,
} from 'lfi'
import type { ChangeEventHandler } from 'react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import Tooltip from './tooltip.tsx'

export const TagsCheckboxGroup = ({
  selectedTags,
  setSelectedTags,
}: {
  selectedTags: Record<string, boolean>
  setSelectedTags: (newSelectedTags: Record<string, boolean>) => void
}) => {
  const [recentlyReset, setRecentlyReset] = useState(false)

  const handleTagChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    event => {
      const tag = event.target.value
      setRecentlyReset(false)
      setSelectedTags({ ...selectedTags, [tag]: !selectedTags[tag] })
    },
    [selectedTags, setSelectedTags],
  )
  const handleReset = useCallback(() => {
    setRecentlyReset(true)
    setSelectedTags(
      pipe(
        keys(selectedTags),
        map(tag => [tag, false]),
        reduce(toObject()),
      ),
    )
  }, [selectedTags, setSelectedTags])

  const tagElements = pipe(
    entries(selectedTags),
    map(([tag, selected]) => (
      <Tag key={tag} tag={tag} selected={selected} onChange={handleTagChange} />
    )),
    reduce(toArray()),
  )

  return (
    <div className='flex flex-wrap justify-center gap-2'>
      <fieldset className='flex flex-wrap justify-center gap-2'>
        <legend className='sr-only'>Tags</legend>
        {tagElements.slice(0, -1)}
        <div className='flex gap-2'>
          {tagElements.at(-1)}
          <div className='aspect-square'>
            <Tooltip content='Reset'>
              {tooltipId => (
                <button
                  aria-labelledby={tooltipId}
                  type='button'
                  className='focus-ring hidden cursor-pointer aspect-square h-full rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 hover:ring-3 active:bg-blue-200 js:block'
                  onClick={handleReset}
                >
                  <ResetIcon />
                </button>
              )}
            </Tooltip>
            <Tooltip content='Search'>
              {tooltipId => (
                <button
                  aria-labelledby={tooltipId}
                  type='submit'
                  className='focus-ring cursor-pointer block aspect-square h-full rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 hover:ring-3 active:bg-blue-200 js:hidden'
                >
                  <SearchIcon />
                </button>
              )}
            </Tooltip>
            {recentlyReset ? (
              <span role='alert' className='sr-only'>
                Unchecked all tags
              </span>
            ) : null}
          </div>
        </div>
      </fieldset>
    </div>
  )
}

const ResetIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    fill='currentColor'
    className='h-full stroke-gray-500 stroke-[1.5]'
    aria-hidden
  >
    <path
      fillRule='evenodd'
      d='M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z'
      clipRule='evenodd'
    />
  </svg>
)

const SearchIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='h-full stroke-gray-500 stroke-[1.5]'
    aria-hidden
  >
    <path
      fillRule='evenodd'
      d='M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z'
      clipRule='evenodd'
    />
  </svg>
)

export const useSelectedTags = (
  tags: Set<string>,
): [
  Record<string, boolean>,
  (newSelectedTags: Record<string, boolean>) => void,
] => {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchTags = new Set(
    pipe(
      searchParams.getAll(`tags`),
      flatMap(tags => tags.split(`,`)),
      reduce(toSet()),
    ),
  )
  const selectedTags = pipe(
    tags,
    map(tag => [tag, searchTags.has(tag)] as const),
    reduce(toObject()),
  )
  const setSelectedTags = useCallback(
    (newSelectedTags: Record<string, boolean>) => {
      const searchTags = pipe(
        entries(newSelectedTags),
        filter(([, selected]) => selected),
        map(([tag]) => tag),
        reduce(toArray()),
      )
        .sort()
        .join(`,`)

      const newSearchParams = new URLSearchParams(searchParams)
      if (searchTags) {
        newSearchParams.set(`tags`, searchTags)
      } else {
        newSearchParams.delete(`tags`)
      }

      setSearchParams(newSearchParams, {
        replace: true,
        preventScrollReset: true,
      })
    },
    [searchParams, setSearchParams],
  )

  return [selectedTags, setSelectedTags]
}

const Tag = ({
  tag,
  selected,
  onChange,
}: {
  tag: string
  selected: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
}) => (
  <label className='group relative rounded-2xl'>
    <input
      type='checkbox'
      name='tags'
      value={tag}
      checked={selected}
      className='focus-ring peer absolute left-0 top-0 size-full cursor-pointer appearance-none rounded-2xl border-2 border-gray-300 checked:border-blue-600 hover:ring-3'
      onChange={onChange}
    />
    <div className='rounded-2xl bg-white p-2.5 font-medium leading-none text-gray-500 transition peer-checked:text-blue-700 peer-hover:bg-blue-50 peer-active:bg-blue-100'>
      {tag}
    </div>
  </label>
)
