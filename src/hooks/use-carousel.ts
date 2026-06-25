import { useEffect, useState } from 'preact/compat'

const useCarouselIndex = ({
  length,
  intervalMs = 8000,
}: {
  length: number
  intervalMs?: number
}): number => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(`(prefers-reduced-motion: reduce)`)
    if (mediaQuery.matches) {
      return
    }

    const id = setInterval(() => {
      setIndex(i => (i + 1) % length)
    }, intervalMs)

    const onChange = () => {
      if (mediaQuery.matches) {
        clearInterval(id)
      }
    }
    mediaQuery.addEventListener(`change`, onChange)

    return () => {
      clearInterval(id)
      mediaQuery.removeEventListener(`change`, onChange)
    }
  }, [length, intervalMs])

  return index
}

export default useCarouselIndex
