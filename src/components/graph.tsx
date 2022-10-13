import {
  any,
  entries,
  filter,
  flatMap,
  index,
  join,
  keys,
  map,
  pipe,
  reduce,
  toArray,
  toObject,
  toSet,
  values,
} from 'lfi'
import clsx from 'clsx'
import cssesc from 'cssesc'
import type { ChangeEventHandler, ReactNode } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useHydrated } from 'remix-utils'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid'
import { Form, useSearchParams } from '@remix-run/react'
import createPanZoom from 'panzoom'
import type { Graph, Position } from '../services/graph.server'
import { Link } from './link.js'

export default function GraphWidget({
  tags,
  graph,
}: {
  tags: Set<string>
  graph: Graph
}) {
  const graphId = useId()
  const descriptionId = useId()

  return (
    <div className='flex flex-col space-y-12'>
      <TagsFilterForm targetId={graphId} tags={tags} />
      <nav
        id={graphId}
        className='focus-ring mx-4 flex flex-1 flex-col overflow-hidden'
        aria-label='Site graph'
        aria-describedby={descriptionId}
      >
        <span id={descriptionId} className='sr-only'>
          Use gestures, arrow keys, or mouse to pan the graph. Use gestures or
          scrolling while holding <kbd>Alt</kbd> or <kbd>Option</kbd> to zoom.
        </span>
        <PannableZoomable>
          <GraphSvg graph={graph} />
        </PannableZoomable>
      </nav>
    </div>
  )
}

function PannableZoomable({ children }: { children: ReactNode }) {
  const elementRef = useRef(null)

  useEffect(() => {
    const panZoom = createPanZoom(elementRef.current!, {
      minZoom: 0.5,
      maxZoom: 2,
      bounds: true,
      boundsPadding: 0.5,
      smoothScroll: false,

      // Prevent zooming interfering with page scrolling
      beforeWheel: e => !e.altKey,
    })

    return () => panZoom.dispose()
  }, [])

  return (
    <div
      ref={elementRef}
      className='flex w-full flex-1 flex-col items-center justify-center'
    >
      {children}
    </div>
  )
}

function GraphSvg({
  graph: {
    vertices,
    edges,
    layout: {
      boundingBox: { width, height },
      positions,
    },
  },
}: {
  graph: Graph
}) {
  const markerId = useId()
  const vertexRadius = 10

  return (
    <div className='relative overflow-visible' style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className='absolute'
      >
        <defs>
          <marker
            id={markerId}
            viewBox='0 0 10 10'
            refX='8'
            refY='5'
            markerUnits='strokeWidth'
            markerWidth='10'
            markerHeight='5'
            orient='auto'
            className='fill-slate-500'
          >
            <path d='M 0 0 L 10 5 L 0 10 z' />
          </marker>
        </defs>
        <g>
          {pipe(
            values(edges),
            map(({ fromId, toId, tags }) => {
              const fromPosition = positions.get(fromId)!
              const toPosition = positions.get(toId)!

              return (
                <line
                  key={`${fromId} ${toId}`}
                  strokeWidth='2.5'
                  markerEnd={`url(#${cssesc(markerId, {
                    isIdentifier: true,
                  })})`}
                  x1={intersectCircle(toPosition, fromPosition, vertexRadius).x}
                  y1={intersectCircle(toPosition, fromPosition, vertexRadius).y}
                  x2={intersectCircle(fromPosition, toPosition, vertexRadius).x}
                  y2={intersectCircle(fromPosition, toPosition, vertexRadius).y}
                  className={clsx(
                    `stroke-slate-500`,
                    pipe(
                      tags,
                      map(tag => `tag:${tag}`),
                      reduce(toArray()),
                    ),
                  )}
                />
              )
            }),
            reduce(toArray()),
          )}
        </g>
      </svg>
      {pipe(
        vertices,
        map(([id, { label, tags, href }]) => {
          const { x, y } = positions.get(id)!
          return (
            <Link
              key={id}
              href={href}
              className={clsx(
                `absolute group focus-ring rounded-full ring-offset-0`,
                pipe(
                  tags,
                  map(tag => `tag:${tag}`),
                  reduce(toArray()),
                ),
              )}
              style={{ left: x - vertexRadius, top: y - vertexRadius }}
            >
              <div
                className='rounded-full bg-slate-500 group-hover:bg-slate-600'
                style={{ width: vertexRadius * 2, height: vertexRadius * 2 }}
              />
              <div className='absolute left-1/2 w-36 bottom-[150%] text-center -translate-x-1/2 font-medium'>
                <span className='bg-slate-200 shadow-slate-200 group-hover:bg-slate-300 group-hover:shadow-slate-300 group-focus-visible:bg-orange-200  group-focus-visible:shadow-orange-200 shadow-[-0.25em_0_0,0.25em_0_0] py-[0.25em]'>
                  {label}
                </span>
              </div>
            </Link>
          )
        }),
        reduce(toArray()),
      )}
    </div>
  )
}

function intersectCircle(
  start: Position,
  end: Position,
  radius: number,
): Position {
  const width = end.x - start.x
  const height = end.y - start.y
  const angle = Math.atan2(height, width)
  const dx = Math.cos(angle) * radius
  const dy = Math.sin(angle) * radius

  return { x: end.x - dx, y: end.y - dy }
}

function TagsFilterForm({
  targetId,
  tags,
}: {
  targetId: string
  tags: Set<string>
}) {
  const hydrated = useHydrated()
  const [logicalOperator, setLogicalOperator] = useLogicalOperator()
  const [selectedTags, setSelectedTags] = useSelectedTags(tags)

  const content = (
    <fieldset className='mx-auto flex max-w-[60ch] flex-col items-center gap-3'>
      <div className='flex items-center gap-3'>
        <legend className='text-lg font-medium'>Filter by tags</legend>
        {
          <LogicalOperatorRadioButtonGroup
            logicalOperator={logicalOperator}
            setLogicalOperator={setLogicalOperator}
          />
        }
      </div>
      <TagsCheckboxGroup
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
      {pipe(
        values(selectedTags),
        any(selected => selected),
      ) && (
        <TagsFilterStyle
          targetId={targetId}
          logicalOperator={logicalOperator}
          selectedTags={selectedTags}
        />
      )}
    </fieldset>
  )

  return hydrated ? content : <Form>{content}</Form>
}

function TagsFilterStyle({
  targetId,
  logicalOperator,
  selectedTags,
}: {
  targetId: string
  logicalOperator: LogicalOperator
  selectedTags: Record<string, boolean>
}) {
  const tagClassSelectors = pipe(
    entries(selectedTags),
    filter(([, selected]) => selected),
    map(([tag]) => `.${cssesc(`tag:${tag}`, { isIdentifier: true })}`),
  )

  const matchingTagsSelector =
    logicalOperator === `&&`
      ? join(``, tagClassSelectors)
      : `:is(${join(`,`, tagClassSelectors)})`

  const escapedTargetId = cssesc(targetId, { isIdentifier: true })
  return (
    <style
      // Safe because all user inputted tags have been filtered to known tags
      // and the tags have been escaped for use in CSS identifiers
      dangerouslySetInnerHTML={{
        __html: `
          #${escapedTargetId} :is(line,a):not(${matchingTagsSelector}){opacity:0.25;}`,
      }}
    />
  )
}

function LogicalOperatorRadioButtonGroup({
  logicalOperator,
  setLogicalOperator,
}: {
  logicalOperator: LogicalOperator
  setLogicalOperator: (newLogicalOperator: LogicalOperator) => void
}) {
  const tooltipId = useId()

  const handleLogicalOperatorChange = useCallback<
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
    ChangeEventHandler<HTMLInputElement>
  >(
    event => setLogicalOperator(event.target.value as LogicalOperator),
    [setLogicalOperator],
  )

  return (
    <div className='flex items-center gap-1.5'>
      <div
        role='radiogroup'
        aria-label='Logical operator'
        aria-describedby={tooltipId}
        className='grid auto-cols-fr grid-flow-col -space-x-[2px] rounded-2xl'
      >
        {pipe(
          LOGICAL_OPERATORS,
          index,
          map(([index, currentLogicalOperator]) => {
            const checked = currentLogicalOperator === logicalOperator
            return (
              <label
                key={currentLogicalOperator}
                className='relative p-2 text-center font-mono font-medium leading-none hover:bg-slate-50'
              >
                <input
                  type='radio'
                  name='op'
                  value={currentLogicalOperator}
                  checked={checked}
                  className={clsx(
                    `peer focus-ring absolute left-0 top-0 h-full w-full cursor-pointer appearance-none border-2 border-slate-300 checked:z-10 checked:border-orange-600 focus-visible:z-20`,
                    index === 0 && `rounded-l-xl`,
                    index === LOGICAL_OPERATORS.length - 1 && `rounded-r-xl`,
                  )}
                  onChange={handleLogicalOperatorChange}
                />
                <span className='text-slate-500 peer-checked:text-orange-700'>
                  {currentLogicalOperator}
                </span>
              </label>
            )
          }),
          reduce(toArray()),
        )}
      </div>
      <div className='relative'>
        <QuestionMarkCircleIcon className='peer h-5 w-5' />
        <div
          id={tooltipId}
          className="sr-only left-1/2 z-10 translate-y-3 -translate-x-1/2 rounded-md bg-neutral-800 text-center text-sm text-white after:absolute after:top-0 after:left-1/2 after:-translate-y-full after:-translate-x-1/2 after:border-8 after:border-solid after:border-transparent after:border-b-neutral-800 after:content-[''] hover:not-sr-only hover:absolute hover:w-[20ch] hover:p-2 peer-hover:not-sr-only peer-hover:absolute peer-hover:w-[20ch] peer-hover:p-2"
        >
          <span className='font-mono'>||</span> and{` `}
          <span className='font-mono'>&&</span> filter for posts matching{` `}
          <em>any</em> and <em>all</em> of the tags, respectively.
        </div>
      </div>
    </div>
  )
}

function useLogicalOperator(): [
  LogicalOperator,
  (newLogicalOperator: LogicalOperator) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams()

  const logicalOperator = parseLogicalOperator(searchParams.get(`op`))
  const setLogicalOperator = useCallback(
    (newLogicalOperator: LogicalOperator) => {
      const newSearchParams = new URLSearchParams(searchParams)

      if (newLogicalOperator === `&&`) {
        newSearchParams.set(`op`, `and`)
      } else {
        newSearchParams.delete(`op`)
      }

      setSearchParams(newSearchParams, {
        replace: true,
        state: { scroll: false },
      })
    },
    [searchParams, setSearchParams],
  )

  return [logicalOperator, setLogicalOperator]
}

const parseLogicalOperator = (operator: string | null): LogicalOperator =>
  operator === `and` ? `&&` : `||`

const LOGICAL_OPERATORS: readonly LogicalOperator[] = [`||`, `&&`]
type LogicalOperator = `||` | `&&`

function TagsCheckboxGroup({
  selectedTags,
  setSelectedTags,
}: {
  selectedTags: Record<string, boolean>
  setSelectedTags: (newSelectedTags: Record<string, boolean>) => void
}) {
  const [recentlyReset, setRecentlyReset] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
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
        map(tag => [tag, false] as const),
        reduce(toObject()),
      ),
    )
  }, [selectedTags, setSelectedTags])

  return (
    <div className='flex flex-col items-center gap-3'>
      <div role='group' className='flex flex-wrap justify-center gap-2'>
        {pipe(
          entries(selectedTags),
          map(([tag, selected]) => (
            <label
              key={tag}
              className='relative rounded-2xl p-2.5 font-medium leading-none hover:bg-slate-50'
            >
              <input
                type='checkbox'
                name='tags'
                value={tag}
                checked={selected}
                className='peer focus-ring absolute left-0 top-0 h-full w-full cursor-pointer appearance-none rounded-2xl border-2 border-slate-300 checked:border-orange-600'
                onChange={handleTagChange}
              />
              <span className='text-slate-500 peer-checked:text-orange-700'>
                {tag}
              </span>
            </label>
          )),
        )}
      </div>
      <div className='flex gap-2'>
        <button
          type='button'
          className='focus-ring hidden rounded-xl bg-slate-200 p-2 text-sm font-medium text-slate-500 hover:bg-slate-300 js:inline-block'
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          type='submit'
          className='focus-ring rounded-xl bg-slate-200 p-2 text-sm font-medium text-slate-500 hover:bg-slate-300 js:hidden'
        >
          Submit
        </button>
        {recentlyReset && (
          <span role='alert' className='sr-only'>
            Unchecked all tags.
          </span>
        )}
      </div>
    </div>
  )
}

function useSelectedTags(
  tags: Set<string>,
): [
  Record<string, boolean>,
  (newSelectedTags: Record<string, boolean>) => void,
] {
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
