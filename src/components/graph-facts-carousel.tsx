import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from './link.tsx'
import useCarouselIndex from '~/hooks/use-carousel.ts'
import type {
  GraphFact,
  GraphFactSegment,
} from '~/services/graph-facts.server.ts'

const GraphFactsCarousel = ({
  facts,
  onSelectVertex,
}: {
  facts: GraphFact[]
  onSelectVertex: (vertexId: string) => void
}) => {
  const index = useCarouselIndex({ length: facts.length })
  const [displayedIndex, setDisplayedIndex] = useState(index)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (index === displayedIndex) {
      return
    }

    if (
      document.hidden ||
      matchMedia(`(prefers-reduced-motion: reduce)`).matches
    ) {
      setDisplayedIndex(index)
      return
    }

    setVisible(false)
  }, [index, displayedIndex])

  const handleTransitionEnd = useCallback(() => {
    if (!visible) {
      setDisplayedIndex(index)
      setVisible(true)
    }
  }, [visible, index])

  const fact = facts[displayedIndex]!

  return (
    <p
      role='status'
      aria-live='polite'
      className='inline-block max-w-prose items-center text-center text-sm text-balance text-gray-600'
    >
      <span
        className={`motion-safe:transition-opacity motion-safe:duration-300 ${visible ? `opacity-100` : `opacity-0`}`}
        onTransitionEnd={handleTransitionEnd}
      >
        {fact.text.map((segment, i) => (
          <FactSegment
            key={i}
            segment={segment}
            onSelectVertex={onSelectVertex}
          />
        ))}
      </span>
    </p>
  )
}

const FactSegment = ({
  segment,
  onSelectVertex,
}: {
  segment: GraphFactSegment
  onSelectVertex: (vertexId: string) => void
}): ReactNode => {
  if (typeof segment === `string`) {
    return segment
  }

  if (`href` in segment) {
    return (
      <Link href={segment.href} className='font-medium underline'>
        {segment.text}
      </Link>
    )
  }

  return (
    <button
      type='button'
      onClick={() => onSelectVertex(segment.vertexId)}
      className='cursor-pointer font-medium underline'
    >
      {segment.text}
    </button>
  )
}

export default GraphFactsCarousel
