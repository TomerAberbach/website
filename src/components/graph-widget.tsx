import { first, get, keys, map, max, pipe, reduce, toArray, values } from 'lfi'
import clsx from 'clsx'
import cssesc from 'cssesc'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Provider as BalanceProvider, Balancer } from 'react-wrap-balancer'
import { Link } from './link.tsx'
import closeSvgPath from './close.svg'
import { createTagClassName } from './tags-filter-form.tsx'
import type {
  Graph,
  Edge as GraphEdge,
  GraphLayout,
  Vertex as GraphVertex,
  Position,
} from '~/services/graph.server.ts'

const GraphWidget = ({ id, graph }: { id: string; graph: Graph }) => {
  const {
    layout: {
      boundingBox: { width, height },
    },
  } = graph

  const [hasMounted, setHasMounted] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  useIsomorphicLayoutEffect(() => {
    setHasMounted(true)
    const scrollElement = scrollElementRef.current!
    const { scrollWidth, clientWidth } = scrollElement
    scrollElement.scrollLeft = (scrollWidth - clientWidth) / 2
  }, [])

  return (
    <div className='flex w-full flex-grow items-center justify-center'>
      <div
        ref={scrollElementRef}
        className={clsx(
          `w-full overflow-x-auto px-16 py-3`,
          !hasMounted && `js:overflow-x-hidden`,
        )}
      >
        <div
          id={id}
          className={clsx(
            `relative m-auto w-full overflow-visible`,
            !hasMounted && `js:left-1/2 js:m-0 js:-translate-x-1/2`,
          )}
          style={{
            minWidth: 0.75 * width,
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

const useIsomorphicLayoutEffect =
  typeof window === `undefined` ? useEffect : useLayoutEffect

const Edges = ({ graph: { edges, layout } }: { graph: Graph }) => {
  const maxWeight = pipe(
    values(edges),
    map(({ hrefs }) => hrefs.size),
    max,
    get,
  )
  const markerId = useId()
  const filterId = useId()
  const { width, height } = layout.boundingBox

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className='absolute h-full w-full'
      aria-hidden
    >
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
        <filter id={filterId} x='-25%' y='10%' width='150%' height='80%'>
          <feFlood floodColor='white' result='bg' />
          <feMerge>
            <feMergeNode in='bg' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>
      <g>
        {pipe(
          values(edges),
          map(edge => (
            <Edge
              key={`${edge.fromId} ${edge.toId}`}
              markerId={markerId}
              filterId={filterId}
              layout={layout}
              maxWeight={maxWeight}
              edge={edge}
            />
          )),
          reduce(toArray()),
        )}
      </g>
    </svg>
  )
}

const Edge = ({
  markerId,
  filterId,
  layout: { positions },
  maxWeight,
  edge: { fromId, toId, tags, hrefs },
}: {
  markerId: string
  filterId: string
  layout: GraphLayout
  maxWeight: number
  edge: GraphEdge
}) => {
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

  const weight = hrefs.size
  return (
    <g className={clsx(getTagClassNames(tags))}>
      <line
        strokeWidth={2.5 + (weight / maxWeight) * 3}
        markerEnd={`url(#${cssesc(markerId, { isIdentifier: true })})`}
        x1={intersectedFromPosition.x}
        y1={intersectedFromPosition.y}
        x2={intersectedToPosition.x}
        y2={intersectedToPosition.y}
        className='stroke-gray-500 transition duration-200'
      />
      <text
        x={(intersectedFromPosition.x + intersectedToPosition.x) / 2}
        y={(intersectedFromPosition.y + intersectedToPosition.y) / 2}
        textAnchor='middle'
        alignmentBaseline='middle'
        filter={`url(#${cssesc(filterId, { isIdentifier: true })})`}
        className='overflow-visible bg-white fill-gray-500 text-xl'
        aria-hidden
      >
        {weight}
      </text>
    </g>
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

const Vertices = ({ graph: { vertices, layout } }: { graph: Graph }) => (
  <BalanceProvider>
    <div>
      {pipe(
        vertices,
        map(([id, vertex]) => (
          <Vertex key={id} layout={layout} vertex={vertex} />
        )),
        reduce(toArray()),
      )}
    </div>
  </BalanceProvider>
)

const Vertex = ({
  layout: {
    boundingBox: { width, height },
    positions,
  },
  vertex,
}: {
  layout: GraphLayout
  vertex: GraphVertex
}) => {
  const { x, y } = positions.get(vertex.id)!

  const labelNode = (
    <span
      className={clsx(
        `break-words box-decoration-clone py-[0.3em] opacity-75 shadow-[-0.25em_0_0,0.25em_0_0] transition duration-200 group-hover/vertex:opacity-90 sm:py-[0.25em]`,
        vertex.type === `internal`
          ? `bg-blue-200 shadow-blue-200 group-hover/link:bg-blue-300 group-hover/link:shadow-blue-300 group-focus-visible/link:bg-blue-300 group-focus-visible/link:shadow-blue-300`
          : `group-odd/vertex:bg-yellow-100 group-odd/vertex:shadow-yellow-100 group-even/vertex:bg-orange-200 group-even/vertex:shadow-orange-200 group-odd/vertex:group-hover/link:bg-yellow-200 group-odd/vertex:group-hover/link:shadow-yellow-200 group-even/vertex:group-hover/link:bg-orange-300 group-even/vertex:group-hover/link:shadow-orange-300 group-odd/vertex:group-focus-visible/link:bg-yellow-200 group-odd/vertex:group-focus-visible/link:shadow-yellow-200 group-even/vertex:group-focus-visible/link:bg-orange-300 group-even/vertex:group-focus-visible/link:shadow-orange-300`,
      )}
    >
      {vertex.label}
    </span>
  )
  const vertexNode = (
    <>
      <div className='h-full w-full rounded-full bg-gray-500 group-hover/link:bg-gray-600' />
      <div
        className={clsx(
          `absolute bottom-[150%] left-1/2 -translate-x-1/2 text-center text-sm font-medium md:text-base`,
          vertex.type === `internal` ? `z-20` : `z-10`,
        )}
      >
        {vertex.type === `internal` ? (
          <div className='inline-block w-52'>
            <Balancer>{labelNode}</Balancer>
          </div>
        ) : (
          labelNode
        )}
      </div>
    </>
  )

  return (
    <div
      className={clsx(
        `group/vertex absolute rounded-full transition duration-200 hover:z-30`,
        getTagClassNames(vertex.tags),
      )}
      style={{
        left: getScaledCalc(x - VERTEX_RADIUS, width),
        top: getScaledCalc(y - VERTEX_RADIUS, height),
        width: getScaledCalc(VERTEX_SIZE, width),
        height: getScaledCalc(VERTEX_SIZE, height),
      }}
    >
      <div className='pointer-events-none absolute inset-0 hidden'>
        {vertexNode}
      </div>
      {vertex.type === `internal` ? (
        <LinkVertex href={vertex.href} reloadDocument={vertex.reloadDocument}>
          {vertexNode}
        </LinkVertex>
      ) : vertex.hrefToTags.size === 1 ? (
        <LinkVertex href={get(first(keys(vertex.hrefToTags)))}>
          {vertexNode}
        </LinkVertex>
      ) : (
        <DialogVertex label={vertex.label} hrefToTags={vertex.hrefToTags}>
          {vertexNode}
        </DialogVertex>
      )}
    </div>
  )
}

const LinkVertex = ({
  href,
  reloadDocument,
  children,
}: {
  href: string
  reloadDocument?: boolean
  children: ReactNode
}) => (
  <Link
    href={href}
    reloadDocument={reloadDocument}
    className='group/link absolute inset-0 rounded-full ring-offset-0 hover:ring'
  >
    {children}
  </Link>
)

const DialogVertex = ({
  label,
  hrefToTags,
  children,
}: {
  label: string
  hrefToTags: Map<string, Set<string>>
  children: ReactNode
}) => {
  const dialogElementRef = useRef<HTMLDialogElement | null>(null)

  const handleClick = useCallback(
    () => dialogElementRef.current!.showModal(),
    [],
  )

  return (
    <>
      <button
        type='button'
        className='group/link focus-ring absolute inset-0 rounded-full ring-offset-0 hover:ring'
        onClick={handleClick}
      >
        {children}
      </button>
      <dialog
        ref={dialogElementRef}
        className='rounded-lg bg-white p-0 shadow-xl'
      >
        <div className='m-6 inline-block'>
          <div className='flex justify-between'>
            <h3 className='font-medium'>
              Links to <em>{label}</em>:
            </h3>
            <div className='ml-6 w-6' />
            <form method='dialog' className='sticky right-6 top-0'>
              <button type='submit' className='focus-ring hover:ring'>
                <img src={closeSvgPath} alt='Close' className='h-6 w-6' />
              </button>
            </form>
          </div>
          <ul className='list-inside list-["→_"] whitespace-nowrap'>
            {pipe(
              hrefToTags,
              map(([href, tags]) => {
                const url = new URL(href)
                const text = url.pathname + url.search + url.hash
                return (
                  <li
                    key={href}
                    className={clsx(`relative`, getTagClassNames(tags))}
                  >
                    <div className='pointer-events-none absolute inset-0 hidden before:content-["→_"]'>
                      {text}
                    </div>
                    <Link href={href} className='underline'>
                      {text}
                    </Link>
                  </li>
                )
              }),
              reduce(toArray()),
            )}
          </ul>
        </div>
      </dialog>
    </>
  )
}

const VERTEX_RADIUS = 10
const VERTEX_SIZE = VERTEX_RADIUS * 2

const getScaledCalc = (value: number, limit: number) =>
  `calc(${(100 * value) / limit}%)`

const getTagClassNames = (tags: Set<string>) =>
  pipe(tags, map(createTagClassName), reduce(toArray()))

export default GraphWidget
