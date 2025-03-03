import { filter, flatMap, map, pipe, reduce, toArray, unique } from 'lfi'
import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import clsx from 'clsx'
import { useLogicalOperator } from './logical-operator-radio-button-group.tsx'

export const TagsListbox = ({
  tags,
  selectedTags,
  setSelectedTags,
}: {
  tags: Set<string>
  selectedTags: string[]
  setSelectedTags: (newSelectedTags: string[]) => void
}) => {
  const listboxButtonRef = useRef<HTMLButtonElement>(null)

  const [recentlyReset, setRecentlyReset] = useState(false)
  const resetSelectedTags = useCallback(() => {
    setSelectedTags([])
    setRecentlyReset(true)
    // Focus the listbox button on resetting so that the user's focus doesn't
    // get placed on the body when the reset button disappears.
    listboxButtonRef.current?.focus()
  }, [setSelectedTags])
  const setNewSelectedTags = useCallback(
    (newSelectedTags: string[]) => {
      setSelectedTags(newSelectedTags)
      setRecentlyReset(false)
    },
    [setSelectedTags],
  )

  return (
    <Listbox value={selectedTags} onChange={setNewSelectedTags} multiple>
      <div className='relative flex min-w-0 flex-col items-center'>
        <ListboxButton
          ref={listboxButtonRef}
          className='focus-ring max-w-full cursor-pointer truncate rounded-xl border-2 border-gray-300 bg-white p-2 leading-none font-medium text-gray-500 transition hover:ring-3'
        >
          <SelectedTags tags={selectedTags} />
        </ListboxButton>
        {selectedTags.length > 0 && (
          <button
            type='button'
            onClick={resetSelectedTags}
            className='focus-ring absolute -bottom-0.5 translate-y-full cursor-pointer text-xs font-medium text-gray-600 transition hover:text-blue-700 hover:ring-3'
          >
            Reset
          </button>
        )}
        {recentlyReset ? (
          <span role='alert' className='sr-only'>
            All tags not selected
          </span>
        ) : null}
      </div>
      <ListboxOptions
        anchor='bottom'
        className='!max-h-76 min-w-[var(--button-width)] rounded-lg border-2 border-gray-300 bg-white py-2 font-medium text-gray-500 outline-hidden transition duration-200 [--anchor-gap:calc(var(--spacing)*3)] focus-visible:border-blue-600'
      >
        {pipe(
          tags,
          map(tag => (
            <ListboxOption
              key={tag}
              value={tag}
              className='group flex cursor-pointer items-center gap-1.5 py-0.5 pr-8.5 pl-2 outline-none data-[active]:bg-blue-200 data-[focus]:bg-blue-100 data-[hover]:bg-blue-100 data-[selected]:text-blue-700'
            >
              <CheckmarkIcon className='invisible group-data-[selected]:visible' />
              {tag}
            </ListboxOption>
          )),
          reduce(toArray()),
        )}
      </ListboxOptions>
    </Listbox>
  )
}

const SelectedTags = ({ tags }: { tags: string[] }) => {
  const [logicalOperator] = useLogicalOperator()
  const conjunction = logicalOperator === `&&` ? `and` : `or`
  switch (tags.length) {
    case 0:
      return `∅`
    case 1:
      return tags[0]!
    case 2:
      return tags.join(` ${conjunction} `)
    case 3:
      return `${tags[0]}, ${tags[1]}, ${conjunction} ${tags[2]}`
    default:
      return `${tags[0]}, ${tags[1]}, ${conjunction} ${tags.length - 2} others`
  }
}

const CheckmarkIcon = ({ className }: { className: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    className={clsx(`size-5 fill-current stroke-current stroke-1`, className)}
    aria-label='Checked'
  >
    <path
      fillRule='evenodd'
      d='M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z'
      clipRule='evenodd'
    />
  </svg>
)

export const useSelectedTags = (
  tags: Set<string>,
): [string[], (newSelectedTags: string[]) => void] => {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedTags = pipe(
    searchParams.getAll(`tags`),
    flatMap(tags => tags.split(`,`)),
    unique,
    filter(tag => tags.has(tag)),
    reduce(toArray()),
  ).sort()

  const setSelectedTags = useCallback(
    (newSelectedTags: string[]) => {
      const searchTags = pipe(
        newSelectedTags,
        unique,
        filter(tag => tags.has(tag)),
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
    [tags, searchParams, setSearchParams],
  )

  return [selectedTags, setSelectedTags]
}
