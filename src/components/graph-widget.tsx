import { map, pipe, reduce, toArray, values } from 'lfi'
import clsx from 'clsx'
import cssesc from 'cssesc'
import { useId } from 'react'
import type { Graph, Position } from '../services/graph.server'
import { Link } from './link.js'

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

export default GraphWidget

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
  <div>
    {pipe(
      vertices,
      map(([id, { label, tags, href, external }]) => {
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
            <div className='absolute left-1/2 bottom-[150%] w-36 -translate-x-1/2 text-center text-sm font-medium sm:w-48 sm:text-base'>
              <span
                className={clsx(
                  `py-[0.3em] opacity-75 shadow-[-0.25em_0_0,0.25em_0_0] transition duration-200 sm:py-[0.25em]`,
                  external
                    ? `group-odd:bg-yellow-200 group-odd:shadow-yellow-200 group-even:bg-orange-200 group-even:shadow-orange-200 group-[:nth-child(even):hover]:bg-orange-300 group-[:nth-child(even):focus-visible]:bg-orange-300 group-[:nth-child(odd):hover]:bg-yellow-300 group-[:nth-child(odd):focus-visible]:bg-yellow-300 group-[:nth-child(even):hover]:shadow-orange-300 group-[:nth-child(even):focus-visible]:shadow-orange-300 group-[:nth-child(odd):hover]:shadow-yellow-300 group-[:nth-child(odd):focus-visible]:shadow-yellow-300`
                    : `bg-blue-200 shadow-blue-200 group-hover:bg-blue-300 group-hover:shadow-blue-300 group-focus-visible:bg-blue-300 group-focus-visible:shadow-blue-300`,
                )}
              >
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
  </div>
)

const VERTEX_RADIUS = 10
const VERTEX_SIZE = VERTEX_RADIUS * 2

const getScaledCalc = (value: number, limit: number) =>
  `calc(${(100 * value) / limit}%)`
