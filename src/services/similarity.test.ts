import { expect, test } from 'vitest'
import { findMostSimilar } from './similarity.ts'

test.each([
  [`nope`, [`cursed-knowledge`, `leverage`, `complexity`], `cursed-knowledge`],
  [`older-pots`, [`older-post`, `newer-post`], `older-post`],
  [`leverage`, [`leverage`, `leverages`], `leverage`],
])(`%s is most similar to %s`, (target, candidates, expected) => {
  expect(findMostSimilar(target, candidates)).toBe(expected)
})

test(`there is no most similar candidate among none`, () => {
  expect(findMostSimilar(`x`, [])).toBeUndefined()
})
