import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import clsx from 'clsx'
import { map, pipe, reduce, toArray } from 'lfi'
import { useCallback, useRef, useState } from 'react'
import { useLogicalOperator } from './logical-operator-radio-button-group.tsx'
import useSearchParams from '~/hooks/use-search-params.ts'
import {
  filterKnownTags,
  formatSelectedTags,
  parseSelectedTags,
} from '~/services/home-state.ts'

export const TagsListbox = ({
  tags,
  selectedTags,
  setSelectedTags,
}: {
  tags: readonly string[]
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
          className='focus-ring max-w-full cursor-pointer truncate rounded-xl border-2 border-gray-300 bg-white p-2 leading-4.5 font-medium text-gray-500 transition hover:ring-3'
        >
          <SelectedTags tags={selectedTags} />
        </ListboxButton>
        <button
          type='button'
          data-home-tags-reset
          onClick={resetSelectedTags}
          className={clsx(
            `focus-ring absolute -bottom-0.5 translate-y-full cursor-pointer text-sm font-medium text-gray-600 transition hover:text-blue-700 hover:ring-3`,
            selectedTags.length === 0 && `hidden`,
          )}
        >
          Reset
        </button>
        {recentlyReset ? (
          <span role='alert' className='sr-only'>
            All tags not selected
          </span>
        ) : null}
      </div>
      <ListboxOptions
        anchor='bottom'
        className='max-h-76! min-w-(--button-width) rounded-lg border-2 border-gray-300 bg-white py-2 font-medium text-gray-500 outline-hidden transition duration-200 [--anchor-gap:--spacing(3)] focus-visible:border-blue-600'
      >
        {pipe(
          tags,
          map(tag => (
            <ListboxOption
              key={tag}
              value={tag}
              className='group flex cursor-pointer items-center gap-1.5 py-0.5 pr-8.5 pl-2 outline-none data-active:bg-blue-200 data-focus:bg-blue-100 data-hover:bg-blue-100 data-selected:text-blue-700'
            >
              <CheckmarkIcon className='invisible group-data-selected:visible' />
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
  const text = formatSelectedTags(tags, logicalOperator)
  if (text !== null) {
    return text
  }
  // The stylesheet from the preload script fills the label before hydration.
  return (
    <>
      <FilterIcon />
      <span data-home-tags-label />
    </>
  )
}

const FilterIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    fill='currentColor'
    className='size-4.5'
    aria-label='Filter'
    data-home-tags-icon
  >
    <path
      fillRule='evenodd'
      d='M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z'
      clipRule='evenodd'
    />
  </svg>
)

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
  tags: readonly string[],
): [string[], (newSelectedTags: string[]) => void] => {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedTags = parseSelectedTags(searchParams, tags)

  const setSelectedTags = useCallback(
    (newSelectedTags: string[]) => {
      const searchTags = filterKnownTags(newSelectedTags, tags).join(`,`)

      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete(`post`)
      if (searchTags) {
        newSearchParams.set(`tags`, searchTags)
      } else {
        newSearchParams.delete(`tags`)
      }

      setSearchParams(newSearchParams)
    },
    [tags, searchParams, setSearchParams],
  )

  return [selectedTags, setSelectedTags]
}
