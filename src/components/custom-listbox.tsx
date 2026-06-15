/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events -- The WAI-ARIA listbox pattern puts `listbox`/`option` roles on `ul`/`li`; keyboard is handled on the listbox and the per-option clicks are mouse enhancements. */

import clsx from 'clsx'
import type { TargetedKeyboardEvent } from 'preact'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'preact/compat'
import { useLogicalOperator } from './logical-operator-radio-button-group.tsx'

// A WAI-ARIA multi-select listbox (replacing Headless UI, which misbehaves and
// bloats under `preact/compat`). Implements the collapsible listbox pattern:
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
export const TagsListbox = ({
  tags,
  selectedTags,
  setSelectedTags,
}: {
  tags: Set<string>
  selectedTags: string[]
  setSelectedTags: (newSelectedTags: string[]) => void
}) => {
  const tagList = useMemo(() => [...tags], [tags])
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentlyReset, setRecentlyReset] = useState(false)

  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags])

  const openListbox = useCallback(() => {
    setActiveIndex(() => {
      const firstSelected = tagList.findIndex(tag => selectedSet.has(tag))
      return firstSelected === -1 ? 0 : firstSelected
    })
    setOpen(true)
    // Focus the list after it renders.
    requestAnimationFrame(() => listRef.current?.focus())
  }, [tagList, selectedSet])

  const closeListbox = useCallback(
    ({ focusButton = true }: { focusButton?: boolean } = {}) => {
      setOpen(false)
      if (focusButton) {
        buttonRef.current?.focus()
      }
    },
    [],
  )

  const toggleTag = useCallback(
    (tag: string) => {
      setRecentlyReset(false)
      setSelectedTags(
        selectedSet.has(tag)
          ? selectedTags.filter(selected => selected !== tag)
          : [...selectedTags, tag],
      )
    },
    [selectedTags, selectedSet, setSelectedTags],
  )

  const resetSelectedTags = useCallback(() => {
    setSelectedTags([])
    setRecentlyReset(true)
    // Keep focus on the button so it doesn't fall to the body when the reset
    // affordance disappears.
    buttonRef.current?.focus()
  }, [setSelectedTags])

  // Close on outside interaction.
  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener(`mousedown`, onPointerDown)
    return () => document.removeEventListener(`mousedown`, onPointerDown)
  }, [open])

  const onButtonKeyDown = (event: TargetedKeyboardEvent<HTMLElement>) => {
    if ([`ArrowDown`, `ArrowUp`, `Enter`, ` `].includes(event.key)) {
      event.preventDefault()
      openListbox()
    }
  }

  const onListKeyDown = (event: TargetedKeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case `ArrowDown`:
        event.preventDefault()
        setActiveIndex(index => Math.min(index + 1, tagList.length - 1))
        break
      case `ArrowUp`:
        event.preventDefault()
        setActiveIndex(index => Math.max(index - 1, 0))
        break
      case `Home`:
        event.preventDefault()
        setActiveIndex(0)
        break
      case `End`:
        event.preventDefault()
        setActiveIndex(tagList.length - 1)
        break
      case `Enter`:
      case ` `:
        event.preventDefault()
        if (tagList[activeIndex] != null) {
          toggleTag(tagList[activeIndex])
        }
        break
      case `Escape`:
        event.preventDefault()
        closeListbox()
        break
      case `Tab`:
        closeListbox({ focusButton: false })
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className='relative flex min-w-0 flex-col items-center'
    >
      <button
        ref={buttonRef}
        type='button'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? closeListbox() : openListbox())}
        onKeyDown={onButtonKeyDown}
        className='focus-ring max-w-full cursor-pointer truncate rounded-xl border-2 border-gray-300 bg-white p-2 leading-4.5 font-medium text-gray-500 transition hover:ring-3'
      >
        <SelectedTags tags={selectedTags} />
      </button>
      {selectedTags.length > 0 && (
        <button
          type='button'
          onClick={resetSelectedTags}
          className='focus-ring absolute -bottom-0.5 translate-y-full cursor-pointer text-sm font-medium text-gray-600 transition hover:text-blue-700 hover:ring-3'
        >
          Reset
        </button>
      )}
      {recentlyReset ? (
        <span role='alert' className='sr-only'>
          All tags not selected
        </span>
      ) : null}
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role='listbox'
          aria-multiselectable='true'
          aria-label='Tags'
          tabIndex={-1}
          aria-activedescendant={optionId(activeIndex)}
          onKeyDown={onListKeyDown}
          className='absolute top-full left-1/2 z-10 mt-3 max-h-76! min-w-full -translate-x-1/2 overflow-auto rounded-lg border-2 border-gray-300 bg-white py-2 font-medium text-gray-500 outline-hidden focus-visible:border-blue-600'
        >
          {tagList.map((tag, index) => {
            const selected = selectedSet.has(tag)
            return (
              <li
                key={tag}
                id={optionId(index)}
                role='option'
                aria-selected={selected}
                onClick={() => toggleTag(tag)}
                onMouseEnter={() => setActiveIndex(index)}
                className={clsx(
                  `group flex cursor-pointer items-center gap-1.5 py-0.5 pr-8.5 pl-2 outline-none hover:bg-blue-100`,
                  index === activeIndex && `bg-blue-200`,
                  selected && `text-blue-700`,
                )}
              >
                <CheckmarkIcon className={clsx(!selected && `invisible`)} />
                {tag}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

const SelectedTags = ({ tags }: { tags: string[] }) => {
  const [logicalOperator] = useLogicalOperator()
  const conjunction = logicalOperator === `&&` ? `and` : `or`
  switch (tags.length) {
    case 0:
      return <FilterIcon />
    case 1:
      return tags[0]!
    case 2:
      return tags.join(` ${conjunction} `)
    case 3: {
      const text1 = `${tags[0]}, ${tags[1]}, ${conjunction} ${tags[2]}`
      const text2 = `${tags[0]} ${conjunction} 2 others`
      return text1.length <= text2.length ? text1 : text2
    }
    default:
      return `${tags[0]}, ${tags[1]}, ${conjunction} ${tags.length - 2} others`
  }
}

const FilterIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 20 20'
    fill='currentColor'
    className='size-4.5'
    aria-label='Filter'
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
