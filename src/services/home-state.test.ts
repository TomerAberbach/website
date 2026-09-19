import { describe, expect, test } from 'vitest'
import {
  formatSelectedTags,
  getHomeData,
  parseHomeState,
  renderPreloadStyle,
} from './home-state.ts'
import { createGraph } from '~/test/graph.ts'

// Newest first, as `getOrderedPosts` orders them.
const GRAPH = createGraph({
  posts: [
    { id: `newest`, tags: [`music`] },
    { id: `middle`, tags: [`code`] },
    { id: `oldest`, tags: [`music`, `code`] },
  ],
})
const DATA = getHomeData(GRAPH.vertices.keys(), GRAPH)

test(`getHomeData lists the posts in order with their tags and relative positions`, () => {
  expect(DATA).toStrictEqual({
    posts: [
      { id: `newest`, tags: [`music`], x: 1 / 6, y: 1 / 6 },
      { id: `middle`, tags: [`code`], x: 3 / 6, y: 3 / 6 },
      { id: `oldest`, tags: [`music`, `code`], x: 5 / 6, y: 5 / 6 },
    ],
    tags: [`code`, `music`],
  })
})

describe(`parseHomeState`, () => {
  test.each([
    [``, { postId: `newest`, previousPostId: `middle`, nextPostId: undefined }],
    [
      `?post=middle`,
      { postId: `middle`, previousPostId: `oldest`, nextPostId: `newest` },
    ],
    [
      `?post=unknown`,
      { postId: `newest`, previousPostId: `middle`, nextPostId: undefined },
    ],
    [
      `?tags=code`,
      { postId: `middle`, previousPostId: `oldest`, nextPostId: undefined },
    ],
    [
      `?post=newest&tags=music`,
      { postId: `newest`, previousPostId: `oldest`, nextPostId: undefined },
    ],
    [
      `?post=oldest&tags=code`,
      { postId: `oldest`, previousPostId: undefined, nextPostId: `middle` },
    ],
  ])(
    `at %s the selected and adjacent posts follow the tag filter`,
    (search, expected) => {
      expect(parseHomeState(search, DATA)).toMatchObject(expected)
    },
  )

  test(`unknown and repeated tags are dropped and the rest sorted`, () => {
    expect(
      parseHomeState(`?tags=music,zzz&tags=code,music`, DATA),
    ).toMatchObject({ tags: [`code`, `music`] })
  })

  test.each([
    [``, `||`],
    [`?op=and`, `&&`],
    [`?op=or`, `||`],
  ])(`at %s the operator is %s`, (search, operator) => {
    expect(parseHomeState(search, DATA).operator).toBe(operator)
  })
})

test.each([
  [[], `||`, null],
  [[`a`], `||`, `a`],
  [[`a`, `b`], `||`, `a or b`],
  [[`a`, `b`], `&&`, `a and b`],
  [[`a`, `b`, `c`], `||`, `a, b, or c`],
  [[`alpha-long`, `beta-long`, `gamma-long`], `&&`, `alpha-long and 2 others`],
  [[`a`, `b`, `c`, `d`], `||`, `a, b, or 2 others`],
] as const)(`formatSelectedTags(%j, %s) is %j`, (tags, operator, text) => {
  expect(formatSelectedTags(tags, operator)).toBe(text)
})

describe(`renderPreloadStyle`, () => {
  test(`swaps the default title for the selected one and centers its vertex`, () => {
    const style = renderPreloadStyle(parseHomeState(`?post=middle`, DATA), DATA)

    expect(style).toContain(
      `[data-home-post-title="newest"] { display: none; }`,
    )
    expect(style).toContain(
      `[data-home-post-title="middle"] { display: inline; }`,
    )
    expect(style).toContain(`--home-graph-x: -50%; --home-graph-y: -50%;`)
    expect(style).toContain(
      `[data-home-adjacent="previous"] { visibility: visible; }`,
    )
    expect(style).toContain(
      `[data-home-adjacent="next"] { visibility: visible; }`,
    )
  })

  test(`hides the arrow for a missing adjacent post`, () => {
    const style = renderPreloadStyle(parseHomeState(``, DATA), DATA)

    expect(style).toContain(
      `[data-home-adjacent="next"] { visibility: hidden; }`,
    )
  })

  test(`labels the tags listbox, shows reset, and fades the filtered vertices`, () => {
    const style = renderPreloadStyle(
      parseHomeState(`?tags=code,music&op=and`, DATA),
      DATA,
    )

    expect(style).toContain(`[data-home-tags-icon] { display: none; }`)
    expect(style).toContain(
      `[data-home-tags-label]::before { content: "code and music"; }`,
    )
    expect(style).toContain(`[data-home-tags-reset] { display: inline-block; }`)
    expect(style).toContain(`:not(.tag\\:code.tag\\:music)`)
    expect(style).toContain(`[data-home-operator="&&"] > input { z-index: 10;`)
    expect(style).toContain(
      `[data-home-operator="||"] > input { z-index: auto;`,
    )
  })

  test(`leaves the tags listbox alone without selected tags`, () => {
    const style = renderPreloadStyle(parseHomeState(``, DATA), DATA)

    expect(style).not.toContain(`data-home-tags`)
    expect(style).not.toContain(`opacity`)
  })
})
