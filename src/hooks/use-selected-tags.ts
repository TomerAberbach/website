import { filter, flatMap, pipe, reduce, toArray, unique } from 'lfi'
import { useCallback } from 'preact/compat'
import { useSearchParams } from './use-search-params.ts'

export const useSelectedTags = (
  tags: Set<string>,
): [string[], (newSelectedTags: string[]) => void] => {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedTags = pipe(
    searchParams.getAll(`tags`),
    flatMap(value => value.split(`,`)),
    unique,
    filter(tag => tags.has(tag)),
    reduce(toArray()),
  ).sort()

  const setSelectedTags = useCallback(
    (newSelectedTags: string[]) => {
      const searchTags = pipe(
        newSelectedTags,
        unique,
        filter(tag => tags.has(tag)),
        reduce(toArray()),
      )
        .sort()
        .join(`,`)

      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete(`post`)
      if (searchTags) {
        newSearchParams.set(`tags`, searchTags)
      } else {
        newSearchParams.delete(`tags`)
      }

      setSearchParams(newSearchParams)
    },
    [tags, searchParams, setSearchParams],
  )

  return [selectedTags, setSelectedTags]
}
