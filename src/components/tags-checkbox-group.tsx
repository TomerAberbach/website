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
import { useCallback, useId, useState } from 'react'
import {
  ArrowUturnLeftIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid'
import { useSearchParams } from '@remix-run/react'
import Tooltip from './tooltip.js'

export const TagsCheckboxGroup = ({
  selectedTags,
  setSelectedTags,
}: {
  selectedTags: Record<string, boolean>
  setSelectedTags: (newSelectedTags: Record<string, boolean>) => void
}) => {
  const resetTooltipId = useId()
  const searchTooltipId = useId()
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
        map((tag): [string, boolean] => [tag, false]),
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
          <Tooltip id={resetTooltipId} className='h-full' content='Reset'>
            <button
              aria-labelledby={resetTooltipId}
              type='button'
              className='focus-ring peer hidden h-full rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 active:bg-blue-200 js:block'
              onClick={handleReset}
            >
              <ArrowUturnLeftIcon className='h-full stroke-gray-500 stroke-[1.5]' />
            </button>
          </Tooltip>
          <Tooltip id={searchTooltipId} content='Search'>
            <button
              aria-labelledby={searchTooltipId}
              type='submit'
              className='focus-ring peer h-full rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 active:bg-blue-200 js:hidden'
            >
              <MagnifyingGlassIcon className='h-full stroke-gray-500 stroke-[1.5]' />
            </button>
          </Tooltip>
          {recentlyReset && (
            <span role='alert' className='sr-only'>
              Unchecked all tags
            </span>
          )}
        </div>
      </fieldset>
    </div>
  )
}

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
        state: { scroll: false },
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
      className='focus-ring peer absolute left-0 top-0 h-full w-full cursor-pointer appearance-none rounded-2xl border-2 border-gray-300 checked:border-blue-600'
      onChange={onChange}
    />
    <div className='rounded-2xl bg-white p-2.5 font-medium leading-none text-gray-500 transition peer-checked:text-blue-700 peer-hover:bg-blue-50 peer-active:bg-blue-100'>
      {tag}
    </div>
  </label>
)
