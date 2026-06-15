import { useEffect, useState } from 'preact/compat'

const useHasMounted = (): boolean => {
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])
  return hasMounted
}

export default useHasMounted
