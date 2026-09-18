import { useEffect, useState } from 'react'
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

  // The facts are shuffled on the client so that every visit starts from a
  // different one. Until then nothing is visible, so the server rendered fact
  // fades in instead of being swapped out.
  const [shuffledFacts, setShuffledFacts] = useState<GraphFact[] | null>(null)
  useEffect(() => {
    setShuffledFacts(shuffle(facts))
  }, [facts])

  // The displayed fact is visible while it is the current one and fades out
  // once the index moves past it.
  const [displayedIndex, setDisplayedIndex] = useState(index)
  const visible = shuffledFacts !== null && displayedIndex === index

  useEffect(() => {
    if (shuffledFacts === null || visible) {
      return
    }

    if (
      document.hidden ||
      matchMedia(`(prefers-reduced-motion: reduce)`).matches
    ) {
      setDisplayedIndex(index)
      return
    }

    // Swap the fact once it has faded out. A timer is used instead of the
    // transition end event, which never fires when the fade has no visible
    // transition, such as before the first paint.
    const id = setTimeout(() => setDisplayedIndex(index), FADE_MS)
    return () => clearTimeout(id)
  }, [index, visible, shuffledFacts])

  const fact = (shuffledFacts ?? facts)[displayedIndex]!

  return (
    <p
      role='status'
      aria-live='polite'
      className='flex max-h-[2lh] min-h-[2lh] max-w-prose items-center text-center text-sm text-balance text-gray-600'
    >
      <span
        className={`motion-safe:transition-opacity motion-safe:duration-300 ${visible ? `opacity-100` : `opacity-0`}`}
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

const FADE_MS = 300

const shuffle = <Value,>(values: readonly Value[]): Value[] => {
  const shuffled = [...values]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}

export default GraphFactsCarousel
