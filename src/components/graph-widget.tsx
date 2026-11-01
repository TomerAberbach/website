import clsx from 'clsx'
import cssesc from 'cssesc'
import { first, get, keys, map, max, pipe, reduce, toArray, values } from 'lfi'
import panzoom from 'panzoom'
import type { PanZoom } from 'panzoom'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import closeSvgPath from './close.svg?url'
import { Link } from './link.tsx'
import useHydrated from '~/hooks/use-hydrated.ts'
import { computeAltitudes, getEdgeAltitude } from '~/services/altitude.ts'
import { placeEdgeLabels } from '~/services/edge-labels.ts'
import {
  INTERNAL_LABEL_WIDTH,
  LABEL_OFFSET,
  LABEL_PADDING_X_EM,
  MIN_GRAPH_WIDTH_RATIO,
  VERTEX_RADIUS,
  VERTEX_SIZE,
} from '~/services/graph-constants.ts'
import type {
  Graph,
  Edge as GraphEdge,
  GraphLayout,
  Vertex as GraphVertex,
  Position,
} from '~/services/graph.ts'
import { createTagClassName } from '~/services/home-state.ts'

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
    vertices,
    edges,
    layout: {
      positions,
      boundingBox: { width, height },
    },
  } = graph

  const altitudes = useMemo(
    () =>
      computeAltitudes({
        vertexIds: vertices.keys(),
        // eslint-disable-next-line unicorn/prefer-iterator-to-array -- Safari before 18.4 lacks `Iterator#toArray`
        edges: [...edges.values()].map(({ fromId, toId }) => [fromId, toId]),
        selectedVertexId,
      }),
    [vertices, edges, selectedVertexId],
  )

  const panningElementRef = useRef<HTMLDivElement>(null)
  const viewportElementRef = useRef<HTMLDivElement>(null)
  const hydrated = useHydrated()
  const [panningState, setPanningPaused] = usePanning({
    graph,
    selectedVertexId,
    hydrated,
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
          `inline-block touch-pan-x touch-pan-y`,
          // Prevent clicking and dragging from a vertex causing a click on the
          // vertex.
          panningState === `panning` && `pointer-events-none`,
        )}
      >
        <div
          id={id}
          className='relative m-auto w-full'
          style={{
            minWidth: MIN_GRAPH_WIDTH_RATIO * width,
            maxWidth: width,
            aspectRatio: `${width} / ${height}`,
            // Before panzoom loads, "fake" the centering in the user's viewport
            // by shifting the graph based on the selected vertex's relative
            // position. The stylesheet from the preload script overrides the
            // shift with the URL's selected vertex through the variables.
            ...(!hydrated && {
              left: `50vw`,
              top: `30vh`,
              transform: `translate(var(--home-graph-x, ${
                (-100 * selectedVertexPosition.x) / width
              }%), var(--home-graph-y, ${
                (-100 * selectedVertexPosition.y) / height
              }%))`,
            }),
          }}
        >
          <Edges graph={graph} altitudes={altitudes} />
          <Vertices
            graph={graph}
            altitudes={altitudes}
            selectedVertexId={selectedVertexId}
            setPanningPaused={setPanningPaused}
          />
        </div>
      </div>
    </div>
  )
}

const usePanning = ({
  graph,
  selectedVertexId,
  hydrated,
  panningElementRef,
  viewportElementRef,
}: {
  graph: Graph
  selectedVertexId: string
  hydrated: boolean
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

  // The vertex panzoom was last moved to, or null before panzoom exists.
  const positionedVertexIdRef = useRef<string | null>(null)

  // Panzoom is created once the render shows the URL's state, in a layout
  // effect so that it positions the graph in the same frame that drops the
  // pre-hydration shift.
  useLayoutEffect(() => {
    if (!hydrated) {
      return undefined
    }

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

    panzoomRef.current = panzoomInstance
    return () => {
      panzoomInstance.dispose()
      panzoomRef.current = null
      positionedVertexIdRef.current = null
    }
  }, [hydrated, panningElementRef])

  // Jumps to the first vertex and pans to each vertex selected after it. The
  // effect depends on `hydrated` because the selected vertex may be the same
  // in the hydration render and the render that creates panzoom.
  useLayoutEffect(() => {
    const panzoom = panzoomRef.current
    if (
      !hydrated ||
      !panzoom ||
      positionedVertexIdRef.current === selectedVertexId
    ) {
      return
    }

    const { x, y } = getPanzoomPosition(selectedVertexId)
    if (
      positionedVertexIdRef.current === null ||
      globalThis.matchMedia(`(prefers-reduced-motion)`).matches
    ) {
      panzoom.moveTo(x, y)
    } else {
      panzoom.smoothMoveTo(x, y)
    }
    positionedVertexIdRef.current = selectedVertexId
  }, [hydrated, getPanzoomPosition, selectedVertexId])

  const panningState = paused ? `paused` : panning ? `panning` : `idle`
  return [panningState, setPaused] as const
}

const Edges = ({
  graph,
  altitudes,
}: {
  graph: Graph
  altitudes: Map<string, number>
}) => {
  const { edges, layout } = graph
  const maxWeight = pipe(
    values(edges),
    map(({ hrefs }) => hrefs.size),
    max,
    get,
  )
  const labelFractions = useMemo(() => placeEdgeLabels(graph), [graph])
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
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          orient='auto'
          className='fill-gray-500'
        >
          <path d='M 0 0 L 10 5 L 0 10 z' />
        </marker>
      </defs>
      <g>
        {pipe(
          values(edges),
          map(edge => ({
            edge,
            altitude: getEdgeAltitude(altitudes, [edge.fromId, edge.toId]),
          })),
          reduce(toArray()),
        )
          // Nearer edges paint later, so they pass over farther ones.
          .sort((entry1, entry2) => entry1.altitude - entry2.altitude)
          .map(({ edge, altitude }) => (
            <Edge
              key={`${edge.fromId} ${edge.toId}`}
              markerId={markerId}
              layout={layout}
              maxWeight={maxWeight}
              labelFraction={labelFractions.get(`${edge.fromId} ${edge.toId}`)}
              altitude={altitude}
              edge={edge}
            />
          ))}
      </g>
    </svg>
  )
}

const Edge = ({
  markerId,
  layout: { positions },
  maxWeight,
  labelFraction = 0.5,
  altitude,
  edge: { fromId, toId, tags, hrefs },
}: {
  markerId: string
  layout: GraphLayout
  maxWeight: number
  labelFraction: number | undefined
  altitude: number
  edge: GraphEdge
}) => {
  const groupProps = {
    className: clsx(`altitude`, getTagClassNames(tags)),
    style: getAltitudeStyle(altitude),
    'data-home-edge': `${fromId} ${toId}`,
  }
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

  // The label sits at the spot along the edge with the most room around it.
  const labelPosition = {
    x:
      intersectedFromPosition.x +
      (intersectedToPosition.x - intersectedFromPosition.x) * labelFraction,
    y:
      intersectedFromPosition.y +
      (intersectedToPosition.y - intersectedFromPosition.y) * labelFraction,
  }
  const beforeLabelPosition = translatePosition(
    labelPosition,
    intersectedFromPosition.angle,
  )
  const afterLabelPosition = translatePosition(
    labelPosition,
    intersectedToPosition.angle,
  )

  const weight = hrefs.size
  // Farther edges are thinner, so a nearer edge shows over one it crosses.
  const lineStrokeWidth =
    (MIN_EDGE_STROKE_WIDTH +
      (weight / maxWeight) * (MAX_EDGE_STROKE_WIDTH - MIN_EDGE_STROKE_WIDTH)) *
    (FLOOR_EDGE_WIDTH + (1 - FLOOR_EDGE_WIDTH) * altitude)
  const lineClassName = `stroke-gray-500 transition duration-200`

  // An edge with one link is the common case, so only heavier edges are
  // labeled with their weight.
  if (weight === 1) {
    return (
      <g {...groupProps}>
        <line
          strokeWidth={lineStrokeWidth}
          markerEnd={`url(#${cssesc(markerId, { isIdentifier: true })})`}
          x1={intersectedFromPosition.x}
          y1={intersectedFromPosition.y}
          x2={intersectedToPosition.x}
          y2={intersectedToPosition.y}
          className={lineClassName}
        />
      </g>
    )
  }

  return (
    <g {...groupProps}>
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
        // A halo in the page's background color keeps the number legible
        // where other edges pass under it.
        strokeWidth={EDGE_LABEL_HALO_WIDTH}
        strokeLinejoin='round'
        style={{ paintOrder: `stroke` }}
        className='overflow-visible fill-gray-500 stroke-white text-xl'
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

const translatePosition = ({ x, y }: Position, angle: number): Position => {
  const dx = Math.cos(angle) * EDGE_LABEL_PADDING
  const dy = Math.sin(angle) * EDGE_LABEL_PADDING
  return { x: x + dx, y: y + dy }
}

const EDGE_LABEL_PADDING = 18.75
const EDGE_LABEL_HALO_WIDTH = 8
const MIN_EDGE_STROKE_WIDTH = 2
const MAX_EDGE_STROKE_WIDTH = 4.5
// The arrowhead's size in stroke widths.
const ARROW_SIZE = 8

const Vertices = ({
  graph: { vertices, layout },
  altitudes,
  selectedVertexId,
  setPanningPaused,
}: {
  graph: Graph
  altitudes: Map<string, number>
  selectedVertexId: string
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
          altitude={altitudes.get(id)!}
          selected={id === selectedVertexId}
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
  altitude,
  selected,
  setPanningPaused,
}: {
  layout: GraphLayout
  vertex: GraphVertex
  altitude: number
  selected: boolean
  setPanningPaused: (value: boolean) => void
}) => {
  const { x, y } = positions.get(vertex.id)!

  const labelNode = (
    <span
      className={clsx(
        `box-decoration-clone py-[0.3em] opacity-75 shadow-[calc(-1*var(--label-padding-x))_0_0,calc(var(--label-padding-x))_0_0] transition duration-200 group-hover/vertex:opacity-90 sm:py-[0.25em]`,
        vertex.type === `internal`
          ? `bg-blue-200 wrap-break-word shadow-blue-200 group-hover/link:bg-blue-300 group-hover/link:shadow-blue-300 group-focus-visible/link:bg-blue-300 group-focus-visible/link:shadow-blue-300`
          : `whitespace-nowrap group-odd/vertex:bg-yellow-100 group-odd/vertex:shadow-yellow-100 group-even/vertex:bg-orange-200 group-even/vertex:shadow-orange-200 group-odd/vertex:group-hover/link:bg-yellow-200 group-odd/vertex:group-hover/link:shadow-yellow-200 group-even/vertex:group-hover/link:bg-orange-300 group-even/vertex:group-hover/link:shadow-orange-300 group-odd/vertex:group-focus-visible/link:bg-yellow-200 group-odd/vertex:group-focus-visible/link:shadow-yellow-200 group-even/vertex:group-focus-visible/link:bg-orange-300 group-even/vertex:group-focus-visible/link:shadow-orange-300`,
      )}
      style={
        { [`--label-padding-x`]: `${LABEL_PADDING_X_EM}em` } as CSSProperties
      }
    >
      {vertex.label}
    </span>
  )
  const vertexNode = (
    <>
      <div
        className='size-full rounded-full bg-gray-500 group-hover/link:bg-gray-600'
        style={{ scale: `var(--altitude-scale)` }}
      />
      <div
        className={clsx(
          `absolute left-1/2 origin-bottom -translate-x-1/2 text-center text-sm font-medium md:text-base`,
          vertex.type === `internal` ? `z-20` : `z-10`,
        )}
        style={{
          bottom: `${(100 * (VERTEX_RADIUS + LABEL_OFFSET)) / VERTEX_SIZE}%`,
          scale: `var(--altitude-scale)`,
        }}
      >
        {vertex.type === `internal` ? (
          <div
            className='inline-block text-balance'
            style={{ width: INTERNAL_LABEL_WIDTH }}
          >
            {labelNode}
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
        `group/vertex altitude absolute rounded-full transition duration-200 hover:z-30`,
        getTagClassNames(vertex.tags),
      )}
      style={{
        left: getScaledCalc(x - VERTEX_RADIUS, width),
        top: getScaledCalc(y - VERTEX_RADIUS, height),
        width: getScaledCalc(VERTEX_SIZE, width),
        height: getScaledCalc(VERTEX_SIZE, height),
        ...getAltitudeStyle(altitude),
        // The selected vertex is nearest whatever the tag filter says.
        ...(selected && { [`--altitude`]: 1 }),
      }}
      data-home-vertex={vertex.id}
    >
      <div className='pointer-events-none absolute inset-0 hidden'>
        {vertexNode}
      </div>
      {vertex.type === `internal` ? (
        <LinkVertex href={vertex.href}>{vertexNode}</LinkVertex>
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
  children,
}: {
  id?: string
  href: string
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

/**
 * The altitude an element has from its distance to the selected vertex, and
 * the opacity that follows from its altitude. The opacity is inline so that
 * it wins over the tag filter's, which fades elements outside the graph.
 */
const getAltitudeStyle = (altitude: number): CSSProperties =>
  ({
    [`--altitude-distance`]: altitude,
    [`--altitude-scale`]: `calc(${FLOOR_SCALE} + ${1 - FLOOR_SCALE} * var(--altitude))`,
    opacity: `calc(${FLOOR_OPACITY} + ${1 - FLOOR_OPACITY} * var(--altitude))`,
  }) as CSSProperties

/** The opacity and the size of an element at the lowest altitude. */
const FLOOR_OPACITY = 0.5
const FLOOR_SCALE = 0.65
/** The width of an edge at the lowest altitude relative to its full width. */
const FLOOR_EDGE_WIDTH = 0.6

const getScaledCalc = (value: number, limit: number) =>
  `calc(${(100 * value) / limit}%)`

const getTagClassNames = (tags: Set<string>) =>
  pipe(tags, map(createTagClassName), reduce(toArray()))

export default GraphWidget
