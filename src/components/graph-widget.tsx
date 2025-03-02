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
import panzoom from 'panzoom'
import type { PanZoom } from 'panzoom'
import type { ReactNode, RefObject } from 'react'
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
import usePrevious from '~/hooks/use-previous.ts'
import useHasMounted from '~/hooks/use-has-mounted.ts'

const GraphWidget = ({
  id,
  graph,
  selectedVertexId,
}: {
  id: string
  graph: Graph
  selectedVertexId: string
}) => {
  const {
    layout: {
      positions,
      boundingBox: { width, height },
    },
  } = graph

  const panningElementRef = useRef<HTMLDivElement>(null)
  const viewportElementRef = useRef<HTMLDivElement>(null)
  const hasMounted = useHasMounted()
  const [panningState, setPanningPaused] = usePanning({
    graph,
    selectedVertexId,
    panningElementRef,
    viewportElementRef,
  })

  const selectedVertexPosition = positions.get(selectedVertexId)!
  return (
    <div
      ref={viewportElementRef}
      className={clsx(
        `fade-y m-auto mx-[calc(50%-50vw)] h-[60vh] w-screen overflow-hidden`,
        panningState !== `paused` && `cursor-grab active:cursor-grabbing`,
      )}
    >
      <div
        ref={panningElementRef}
        className={clsx(
          `inline-block`,
          // Prevent clicking and dragging from a vertex causing a click on the
          // vertex.
          panningState === `panning` && `pointer-events-none`,
        )}
      >
        <div
          id={id}
          className='relative m-auto w-full'
          style={{
            minWidth: 0.75 * width,
            maxWidth: width,
            aspectRatio: `${width} / ${height}`,
            // Before panzoom loads, "fake" the centering in the user's viewport
            // by shifting the graph based on the selected vertex's relative
            // position.
            ...(!hasMounted && {
              left: `50vw`,
              top: `30vh`,
              transform: `translate(${
                (-100 * selectedVertexPosition.x) / width
              }%, ${(-100 * selectedVertexPosition.y) / height}%)`,
            }),
          }}
        >
          <Edges graph={graph} />
          <Vertices graph={graph} setPanningPaused={setPanningPaused} />
        </div>
      </div>
    </div>
  )
}

const usePanning = ({
  graph,
  selectedVertexId,
  panningElementRef,
  viewportElementRef,
}: {
  graph: Graph
  selectedVertexId: string
  panningElementRef: RefObject<HTMLElement | null>
  viewportElementRef: RefObject<HTMLElement | null>
}) => {
  const { positions, boundingBox } = graph.layout
  const panzoomRef = useRef<PanZoom>(null)
  const [panning, setPanning] = useState(false)

  const getPanzoomPosition = useCallback(
    (vertexId: string): Position => {
      const { x, y } = positions.get(vertexId)!
      const ratioX = x / boundingBox.width
      const ratioY = y / boundingBox.height

      const { offsetWidth: viewportWidth, offsetHeight: viewportHeight } =
        viewportElementRef.current!
      const viewportCenterX = viewportWidth / 2
      const viewportCenterY = viewportHeight / 2

      const { offsetWidth: contentWidth, offsetHeight: contentHeight } =
        panningElementRef.current!

      const panzoomX = -(ratioX * contentWidth - viewportCenterX)
      const panzoomY = -(ratioY * contentHeight - viewportCenterY)
      return { x: panzoomX, y: panzoomY }
    },
    [
      boundingBox.width,
      boundingBox.height,
      positions,
      panningElementRef,
      viewportElementRef,
    ],
  )

  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) {
      panzoomRef.current?.pause()
    } else {
      panzoomRef.current?.resume()
    }
  }, [paused])

  useIsomorphicLayoutEffect(() => {
    const panningElement = panningElementRef.current!

    const panzoomInstance = panzoom(panningElement, {
      // Disable zooming.
      minZoom: 1,
      maxZoom: 1,
      // Ignore mouse wheel for scrolling.
      beforeWheel: () => true,
      // Allow people to click links on mobile.
      onTouch: () => false,
      // Enforce bounds.
      bounds: true,
      boundsPadding: 0.5,
    })
    panzoomInstance.on(`panstart`, () => setPanning(true))
    panzoomInstance.on(`panend`, () => setPanning(false))

    const pause = () => panzoomInstance.pause()
    panningElement.addEventListener(`touchstart`, pause)
    const resume = () => panzoomInstance.resume()
    panningElement.addEventListener(`touchcancel`, resume)
    panningElement.addEventListener(`touchend`, resume)

    // Decrease the probability of a flicker on load.
    requestAnimationFrame(() => {
      const { x, y } = getPanzoomPosition(selectedVertexId)
      requestAnimationFrame(() => {
        panzoomInstance.moveTo(x, y)
      })
    })

    panzoomRef.current = panzoomInstance
    return () => {
      panningElement.removeEventListener(`touchstart`, pause)
      panningElement.removeEventListener(`touchcancel`, resume)
      panningElement.removeEventListener(`touchend`, resume)

      panzoomInstance.dispose()
      panzoomRef.current = null
    }
  }, [panningElementRef])

  const previousSelectedVertexId = usePrevious(selectedVertexId)
  useIsomorphicLayoutEffect(() => {
    if (
      previousSelectedVertexId === null ||
      selectedVertexId === previousSelectedVertexId
    ) {
      return
    }

    const { x, y } = getPanzoomPosition(selectedVertexId)
    const panzoom = panzoomRef.current!

    if (window.matchMedia(`(prefers-reduced-motion)`).matches) {
      panzoom.moveTo(x, y)
    } else {
      panzoom.smoothMoveTo(x, y)
    }
  }, [getPanzoomPosition, selectedVertexId, previousSelectedVertexId])

  const panningState = paused ? `paused` : panning ? `panning` : `idle`
  return [panningState, setPaused] as const
}

const useIsomorphicLayoutEffect =
  typeof document === `undefined` ? useEffect : useLayoutEffect

const Edges = ({ graph: { edges, layout } }: { graph: Graph }) => {
  const maxWeight = pipe(
    values(edges),
    map(({ hrefs }) => hrefs.size),
    max,
    get,
  )
  const markerId = useId()
  const { width, height } = layout.boundingBox

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className='absolute size-full'
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
      </defs>
      <g>
        {pipe(
          values(edges),
          map(edge => (
            <Edge
              key={`${edge.fromId} ${edge.toId}`}
              markerId={markerId}
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
  layout: { positions },
  maxWeight,
  edge: { fromId, toId, tags, hrefs },
}: {
  markerId: string
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

  const labelPosition = {
    x: (intersectedFromPosition.x + intersectedToPosition.x) / 2,
    y: (intersectedFromPosition.y + intersectedToPosition.y) / 2,
  }
  const beforeLabelPosition = translatePosition(
    labelPosition,
    intersectedFromPosition.angle,
    EDGE_LABEL_PADDING,
  )
  const afterLabelPosition = translatePosition(
    labelPosition,
    intersectedToPosition.angle,
    EDGE_LABEL_PADDING,
  )

  const weight = hrefs.size
  const lineStrokeWidth =
    MIN_EDGE_STROKE_WIDTH +
    (weight / maxWeight) * (MAX_EDGE_STROKE_WIDTH - MIN_EDGE_STROKE_WIDTH)
  const lineClassName = `stroke-gray-500 transition duration-200`

  return (
    <g className={clsx(getTagClassNames(tags))}>
      <line
        strokeWidth={lineStrokeWidth}
        x1={intersectedFromPosition.x}
        y1={intersectedFromPosition.y}
        x2={beforeLabelPosition.x}
        y2={beforeLabelPosition.y}
        className={lineClassName}
      />
      <text
        x={labelPosition.x}
        y={labelPosition.y}
        textAnchor='middle'
        alignmentBaseline='middle'
        className='overflow-visible fill-gray-500 text-xl'
        aria-hidden
      >
        {weight}
      </text>
      <line
        strokeWidth={lineStrokeWidth}
        markerEnd={`url(#${cssesc(markerId, { isIdentifier: true })})`}
        x1={afterLabelPosition.x}
        y1={afterLabelPosition.y}
        x2={intersectedToPosition.x}
        y2={intersectedToPosition.y}
        className={lineClassName}
      />
    </g>
  )
}

const intersectCircle = (
  start: Position,
  end: Position,
  radius: number,
): Position & { angle: number } => {
  const width = end.x - start.x
  const height = end.y - start.y
  const angle = Math.atan2(height, width)
  const dx = Math.cos(angle) * radius
  const dy = Math.sin(angle) * radius

  return { x: end.x - dx, y: end.y - dy, angle }
}

const translatePosition = (
  { x, y }: Position,
  angle: number,
  distance: number,
): Position => {
  const dx = Math.cos(angle) * distance
  const dy = Math.sin(angle) * distance
  return { x: x + dx, y: y + dy }
}

const EDGE_LABEL_PADDING = 18.75
const MIN_EDGE_STROKE_WIDTH = 2.5
const MAX_EDGE_STROKE_WIDTH = 5.5

const Vertices = ({
  graph: { vertices, layout },
  setPanningPaused,
}: {
  graph: Graph
  setPanningPaused: (value: boolean) => void
}) => (
  <div>
    {pipe(
      vertices,
      map(([id, vertex]) => (
        <Vertex
          key={id}
          layout={layout}
          vertex={vertex}
          setPanningPaused={setPanningPaused}
        />
      )),
      reduce(toArray()),
    )}
  </div>
)

const Vertex = ({
  layout: {
    boundingBox: { width, height },
    positions,
  },
  vertex,
  setPanningPaused,
}: {
  layout: GraphLayout
  vertex: GraphVertex
  setPanningPaused: (value: boolean) => void
}) => {
  const { x, y } = positions.get(vertex.id)!

  const labelNode = (
    <span
      className={clsx(
        `box-decoration-clone py-[0.3em] break-words opacity-75 shadow-[-0.25em_0_0,0.25em_0_0] transition duration-200 group-hover/vertex:opacity-90 sm:py-[0.25em]`,
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
      <div className='size-full rounded-full bg-gray-500 group-hover/link:bg-gray-600' />
      <div
        className={clsx(
          `absolute bottom-[150%] left-1/2 -translate-x-1/2 text-center text-sm font-medium md:text-base`,
          vertex.type === `internal` ? `z-20` : `z-10`,
        )}
      >
        {vertex.type === `internal` ? (
          <div className='inline-block w-52 text-balance'>{labelNode}</div>
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
        <DialogVertex
          setPanningPaused={setPanningPaused}
          label={vertex.label}
          hrefToTags={vertex.hrefToTags}
        >
          {vertexNode}
        </DialogVertex>
      )}
    </div>
  )
}

const LinkVertex = ({
  id,
  href,
  reloadDocument,
  children,
}: {
  id?: string
  href: string
  reloadDocument?: boolean
  children: ReactNode
}) => {
  const preventDefault = useCallback<React.EventHandler<React.SyntheticEvent>>(
    e => e.preventDefault(),
    [],
  )
  return (
    <Link
      id={id}
      href={href}
      reloadDocument={reloadDocument}
      // Prevent dragging vertex text, which conflicts with graph panning.
      onMouseDown={preventDefault}
      onMouseMove={preventDefault}
      className='group/link absolute inset-0 cursor-pointer rounded-full ring-offset-0 hover:ring-3'
    >
      {children}
    </Link>
  )
}

const DialogVertex = ({
  setPanningPaused,
  label,
  hrefToTags,
  children,
}: {
  setPanningPaused: (value: boolean) => void
  label: string
  hrefToTags: Map<string, Set<string>>
  children: ReactNode
}) => {
  const dialogElementRef = useRef<HTMLDialogElement | null>(null)

  const openDialog = useCallback(() => {
    setPanningPaused(true)
    dialogElementRef.current!.showModal()
  }, [setPanningPaused])
  const resumePanning = useCallback(
    () => setPanningPaused(false),
    [setPanningPaused],
  )

  return (
    <>
      <button
        type='button'
        className='group/link focus-ring absolute inset-0 cursor-pointer rounded-full ring-offset-0 hover:ring-3'
        onClick={openDialog}
      >
        {children}
      </button>
      <dialog
        ref={dialogElementRef}
        className='m-auto rounded-lg bg-white p-0 shadow-xl'
        onClose={resumePanning}
      >
        <div className='m-6 inline-block'>
          <div className='flex justify-between'>
            <h3 className='font-medium'>
              Links to <em>{label}</em>:
            </h3>
            <div className='ml-6 w-6' />
            <form method='dialog' className='sticky top-0 right-6'>
              <button
                type='submit'
                className='focus-ring cursor-pointer hover:ring-3'
              >
                <img src={closeSvgPath} alt='Close' className='size-6' />
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
