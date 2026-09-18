/**
 * The candidate most similar to the target by the Sørensen–Dice coefficient
 * of their character bigrams.
 */
export const findMostSimilar = (
  target: string,
  candidates: readonly string[],
): string | undefined => {
  let best: string | undefined
  let bestRating = -1
  for (const candidate of candidates) {
    const rating = compareTwoStrings(target, candidate)
    if (rating > bestRating) {
      best = candidate
      bestRating = rating
    }
  }
  return best
}

const compareTwoStrings = (first: string, second: string): number => {
  const left = first.replaceAll(/\s+/gu, ``)
  const right = second.replaceAll(/\s+/gu, ``)
  if (left === right) {
    return 1
  }
  if (left.length < 2 || right.length < 2) {
    return 0
  }

  const bigrams = new Map<string, number>()
  for (let i = 0; i < left.length - 1; i++) {
    const bigram = left.slice(i, i + 2)
    bigrams.set(bigram, (bigrams.get(bigram) ?? 0) + 1)
  }

  let intersectionSize = 0
  for (let i = 0; i < right.length - 1; i++) {
    const bigram = right.slice(i, i + 2)
    const count = bigrams.get(bigram) ?? 0
    if (count > 0) {
      bigrams.set(bigram, count - 1)
      intersectionSize++
    }
  }

  return (2 * intersectionSize) / (left.length + right.length - 2)
}
