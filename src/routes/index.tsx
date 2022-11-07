import type { LoaderFunction } from '@remix-run/node'
import {
  any,
  entries,
  filter,
  flatMap,
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
import type { ChangeEventHandler } from 'react'
import { useCallback, useId, useState } from 'react'
import {
  ArrowUturnLeftIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid'
import { Form, useSearchParams } from '@remix-run/react'
import { getTags } from '../services/posts.server'
import { json, useLoaderData } from '../services/json.js'
import { getGraph } from '../services/graph.server'
import type { Graph, Position } from '../services/graph.server'
import { Link } from '../components/link.js'
import Tooltip from '../components/tooltip.js'

const HomePage = () => {
  const { tags, graph } = useLoaderData<LoaderData>()
  const graphId = useId()

  return (
    <div className='flex flex-1 flex-col gap-8 sm:gap-y-12 md:gap-y-20'>
      <TagsFilterForm targetId={graphId} tags={tags} />
      <GraphWidget id={graphId} graph={graph} />
    </div>
  )
}

const TagsFilterForm = ({
  targetId,
  tags,
}: {
  targetId: string
  tags: Set<string>
}) => {
  const [logicalOperator, setLogicalOperator] = useLogicalOperator()
  const [selectedTags, setSelectedTags] = useSelectedTags(tags)

  return (
    <Form className='mx-auto flex max-w-[60ch] flex-col items-center gap-3'>
      <div className='flex items-center gap-3'>
        <h2 className='text-lg font-medium md:text-xl'>Filter by tags</h2>
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
    </Form>
  )
}

const TagsFilterStyle = ({
  targetId,
  logicalOperator,
  selectedTags,
}: {
  targetId: string
  logicalOperator: LogicalOperator
  selectedTags: Record<string, boolean>
}) => {
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

const LogicalOperatorRadioButtonGroup = ({
  logicalOperator,
  setLogicalOperator,
}: {
  logicalOperator: LogicalOperator
  setLogicalOperator: (newLogicalOperator: LogicalOperator) => void
}) => {
  const tooltipId = useId()

  const handleLogicalOperatorChange = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >(
    event => setLogicalOperator(event.target.value as LogicalOperator),
    [setLogicalOperator],
  )

  return (
    <div className='flex items-center gap-1.5'>
      <fieldset aria-describedby={tooltipId}>
        <legend className='sr-only'>Logical operator</legend>
        <div className='flex -space-x-[2px] rounded-2xl'>
          {LOGICAL_OPERATORS.map(currentLogicalOperator => {
            const checked = currentLogicalOperator === logicalOperator
            return (
              <label
                key={currentLogicalOperator}
                className='group relative text-center font-mono font-medium leading-none first:rounded-l-xl last:rounded-r-xl md:text-lg md:leading-none'
              >
                <input
                  type='radio'
                  name='op'
                  value={currentLogicalOperator}
                  checked={checked}
                  className='focus-ring peer absolute left-0 top-0 h-full w-full cursor-pointer appearance-none border-2 border-gray-300 checked:z-10 checked:border-blue-600 hover:z-20 focus-visible:z-20 group-first:rounded-l-xl group-last:rounded-r-xl'
                  onChange={handleLogicalOperatorChange}
                />
                <div className='h-full w-full bg-white p-2 text-gray-500 transition group-first:rounded-l-xl group-last:rounded-r-xl peer-checked:text-blue-700 peer-hover:bg-blue-50 peer-active:bg-blue-100'>
                  {currentLogicalOperator}
                </div>
              </label>
            )
          })}
        </div>
      </fieldset>
      <Tooltip
        content={
          <>
            <span className='font-mono'>||</span> and{` `}
            <span className='font-mono'>&&</span> filter for posts matching{` `}
            <em>any</em> and <em>all</em> of the tags, respectively
          </>
        }
      >
        <QuestionMarkCircleIcon className='peer h-5 w-5' />
      </Tooltip>
    </div>
  )
}

const useLogicalOperator = (): [
  LogicalOperator,
  (newLogicalOperator: LogicalOperator) => void,
] => {
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

const TagsCheckboxGroup = ({
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

  return (
    <div className='flex flex-wrap justify-center gap-2'>
      <fieldset className='flex flex-wrap justify-center gap-2'>
        <legend className='sr-only'>Tags</legend>
        {pipe(
          entries(selectedTags),
          map(([tag, selected]) => (
            <label key={tag} className='group relative rounded-2xl'>
              <input
                type='checkbox'
                name='tags'
                value={tag}
                checked={selected}
                className='focus-ring peer absolute left-0 top-0 h-full w-full cursor-pointer appearance-none rounded-2xl border-2 border-gray-300 checked:border-blue-600'
                onChange={handleTagChange}
              />
              <div className='rounded-2xl bg-white p-2.5 font-medium leading-none text-gray-500 transition peer-checked:text-blue-700 peer-hover:bg-blue-50 peer-active:bg-blue-100'>
                {tag}
              </div>
            </label>
          )),
        )}
        <div>
          <Tooltip id={resetTooltipId} content='Reset'>
            <button
              aria-labelledby={resetTooltipId}
              type='button'
              className='focus-ring peer hidden rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 active:bg-blue-200 js:inline-block'
              onClick={handleReset}
            >
              <ArrowUturnLeftIcon className='h-4 w-4 stroke-gray-500 stroke-[1.5]' />
            </button>
          </Tooltip>
          <Tooltip id={searchTooltipId} content='Search'>
            <button
              aria-labelledby={searchTooltipId}
              type='submit'
              className='focus-ring peer rounded-full border-2 border-gray-300 bg-white p-2 text-sm font-medium hover:bg-blue-100 active:bg-blue-200 js:hidden'
            >
              <MagnifyingGlassIcon className='h-4 w-4 stroke-gray-500 stroke-[1.5]' />
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

const useSelectedTags = (
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

const GraphWidget = ({ id, graph }: { id: string; graph: Graph }) => {
  const {
    layout: {
      boundingBox: { width, height },
    },
  } = graph

  return (
    <div className='flex w-full flex-grow items-center justify-center'>
      <div className='w-full overflow-x-auto px-16 py-3'>
        <div
          id={id}
          className='relative m-auto w-full overflow-visible'
          style={{
            minWidth: width / 2,
            maxWidth: width,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          <Edges graph={graph} />
          <Vertices graph={graph} />
        </div>
      </div>
    </div>
  )
}

const Edges = ({
  graph: {
    edges,
    layout: {
      boundingBox: { width, height },
      positions,
    },
  },
}: {
  graph: Graph
}) => {
  const markerId = useId()

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className='absolute h-full w-full'>
      <defs>
        <marker
          id={markerId}
          viewBox='0 0 10 10'
          refX='8.5'
          refY='5'
          markerUnits='strokeWidth'
          markerWidth='17'
          markerHeight='7.5'
          orient='auto'
          className='fill-gray-500'
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

            const intersectedFromPosition = intersectCircle(
              toPosition,
              fromPosition,
              VERTEX_RADIUS,
            )
            const intersectedToPosition = intersectCircle(
              fromPosition,
              toPosition,
              VERTEX_RADIUS,
            )

            return (
              <line
                key={`${fromId} ${toId}`}
                strokeWidth='2.5'
                markerEnd={`url(#${cssesc(markerId, {
                  isIdentifier: true,
                })})`}
                x1={intersectedFromPosition.x}
                y1={intersectedFromPosition.y}
                x2={intersectedToPosition.x}
                y2={intersectedToPosition.y}
                className={clsx(
                  `stroke-gray-500`,
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
  )
}

const intersectCircle = (
  start: Position,
  end: Position,
  radius: number,
): Position => {
  const width = end.x - start.x
  const height = end.y - start.y
  const angle = Math.atan2(height, width)
  const dx = Math.cos(angle) * radius
  const dy = Math.sin(angle) * radius

  return { x: end.x - dx, y: end.y - dy }
}

const Vertices = ({
  graph: {
    vertices,
    layout: {
      boundingBox: { width, height },
      positions,
    },
  },
}: {
  graph: Graph
}) => (
  <>
    {pipe(
      vertices,
      map(([id, { label, tags, href }]) => {
        const { x, y } = positions.get(id)!

        return (
          <Link
            key={id}
            href={href}
            className={clsx(
              `focus-ring group absolute rounded-full ring-offset-0`,
              pipe(
                tags,
                map(tag => `tag:${tag}`),
                reduce(toArray()),
              ),
            )}
            style={{
              left: getScaledCalc(x - VERTEX_RADIUS, width),
              top: getScaledCalc(y - VERTEX_RADIUS, height),
              width: getScaledCalc(VERTEX_SIZE, width),
              height: getScaledCalc(VERTEX_SIZE, height),
            }}
          >
            <div className='h-full w-full rounded-full bg-gray-500 group-hover:bg-gray-600' />
            <div className='absolute left-1/2 bottom-[150%] w-36 -translate-x-1/2 text-center text-sm font-medium sm:w-48 sm:text-base md:text-lg'>
              <span className='bg-gray-200 py-[0.3em] opacity-75 shadow-[-0.25em_0_0,0.25em_0_0] shadow-gray-200 group-hover:bg-gray-300 group-hover:shadow-gray-300 group-focus-visible:bg-blue-200 group-focus-visible:shadow-blue-200 sm:py-[0.25em]'>
                <span className='opacity-0' aria-hidden='true'>
                  {label}
                </span>
              </span>
              <span className='absolute left-0 top-0 w-full'>{label}</span>
            </div>
          </Link>
        )
      }),
      reduce(toArray()),
    )}
  </>
)

const VERTEX_RADIUS = 10
const VERTEX_SIZE = VERTEX_RADIUS * 2

const getScaledCalc = (value: number, limit: number) =>
  `calc(${(100 * value) / limit}%)`

export const loader: LoaderFunction = async () =>
  json<LoaderData>({
    tags: await getTags(),
    graph: await getGraph(),
  })

type LoaderData = {
  tags: Set<string>
  graph: Graph
}

// eslint-disable-next-line camelcase
export const unstable_shouldReload = () => false

export default HomePage
