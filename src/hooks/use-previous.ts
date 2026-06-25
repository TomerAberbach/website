import { useEffect, useRef } from 'preact/compat'

const usePrevious = <Value>(value: Value): Value | null => {
  const ref = useRef<Value>(null)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export default usePrevious
