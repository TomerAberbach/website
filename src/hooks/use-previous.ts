import { useEffect, useRef } from 'react'

const usePrevious = <Value>(value: Value): Value | null => {
  const ref = useRef<Value>(null)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export default usePrevious
