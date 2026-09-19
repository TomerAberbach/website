import cssesc from 'cssesc'
import type { Graph } from './graph.ts'

/**
 * The state the home page derives from its URL, and the stylesheet that shows
 * that state before React hydrates.
 *
 * The static HTML of the home page cannot depend on the URL, so it is rendered
 * for the default state with every post's title in the document. A blocking
 * script in the head parses the URL with `parseHomeState` and inserts the
 * stylesheet from `renderPreloadStyle`, which hides and shows the parts of that
 * HTML so that the page paints in the URL's state. Once React renders with the
 * URL's state, it removes the stylesheet.
 */

/** A post on the home page, with its vertex's position as ratios of the graph's size. */
export type HomePost = { id: string; tags: string[]; x: number; y: number }

/** The posts, newest first, and the sorted tags across them. */
export type HomeData = { posts: HomePost[]; tags: string[] }

export type LogicalOperator = `||` | `&&`

export type HomeState = {
  postId: string
  tags: string[]
  operator: LogicalOperator
  previousPostId: string | undefined
  nextPostId: string | undefined
}

export const getHomeData = (
  postIds: Iterable<string>,
  graph: Graph,
): HomeData => {
  const { positions, boundingBox } = graph.layout
  const posts = [...postIds].map(id => {
    const { x, y } = positions.get(id)!
    return {
      id,
      tags: [...graph.vertices.get(id)!.tags],
      x: x / boundingBox.width,
      y: y / boundingBox.height,
    }
  })
  const tags = [...new Set(posts.flatMap(post => post.tags))].sort()
  return { posts, tags }
}

export const parseHomeState = (search: string, data: HomeData): HomeState => {
  const searchParams = new URLSearchParams(search)
  const tags = parseSelectedTags(searchParams, data.tags)
  const postId = parseSelectedPostId(searchParams, data.posts, tags)
  return {
    postId,
    tags,
    operator: parseLogicalOperator(searchParams),
    previousPostId: getAdjacentPostId(data.posts, postId, `previous`, tags),
    nextPostId: getAdjacentPostId(data.posts, postId, `next`, tags),
  }
}

/** The known tags in the `tags` params, without duplicates and sorted. */
export const parseSelectedTags = (
  searchParams: URLSearchParams,
  tags: readonly string[],
): string[] =>
  filterKnownTags(
    searchParams.getAll(`tags`).flatMap(tags => tags.split(`,`)),
    tags,
  )

/** The given tags that are known, without duplicates and sorted. */
export const filterKnownTags = (
  selectedTags: Iterable<string>,
  tags: readonly string[],
): string[] => {
  const knownTags = new Set(tags)
  return [...new Set(selectedTags)].filter(tag => knownTags.has(tag)).sort()
}

export const parseLogicalOperator = (
  searchParams: URLSearchParams,
): LogicalOperator => (searchParams.get(`op`) === `and` ? `&&` : `||`)

/** The post in the `post` param, or the first post when it is missing or unknown. */
export const parseSelectedPostId = (
  searchParams: URLSearchParams,
  posts: readonly HomePost[],
  selectedTags: readonly string[],
): string => {
  const postId = searchParams.get(`post`)
  return posts.some(post => post.id === postId)
    ? postId!
    : getFirstPostId(posts, selectedTags)
}

/** The first post with any of the selected tags, or the first post overall. */
export const getFirstPostId = (
  posts: readonly HomePost[],
  selectedTags: readonly string[],
): string => {
  const selectedTagsSet = new Set(selectedTags)
  return (
    posts.find(post => post.tags.some(tag => selectedTagsSet.has(tag))) ??
    posts[0]!
  ).id
}

/**
 * The nearest post in the given direction with any of the selected tags, or
 * the adjacent post when no tags are selected.
 */
export const getAdjacentPostId = (
  posts: readonly HomePost[],
  postId: string,
  direction: `previous` | `next`,
  selectedTags: readonly string[],
): string | undefined => {
  const selectedTagsSet = new Set(selectedTags)
  const step = direction === `previous` ? 1 : -1
  for (
    let index = posts.findIndex(post => post.id === postId) + step;
    index >= 0 && index < posts.length;
    index += step
  ) {
    const post = posts[index]!
    if (
      selectedTagsSet.size === 0 ||
      post.tags.some(tag => selectedTagsSet.has(tag))
    ) {
      return post.id
    }
  }
  return undefined
}

/** The text of the tags listbox button, or null for the filter icon. */
export const formatSelectedTags = (
  tags: readonly string[],
  operator: LogicalOperator,
): string | null => {
  const conjunction = operator === `&&` ? `and` : `or`
  switch (tags.length) {
    case 0:
      return null
    case 1:
      return tags[0]!
    case 2:
      return tags.join(` ${conjunction} `)
    case 3: {
      const text1 = `${tags[0]}, ${tags[1]}, ${conjunction} ${tags[2]}`
      const text2 = `${tags[0]} ${conjunction} 2 others`
      return text1.length <= text2.length ? text1 : text2
    }
    default:
      return `${tags[0]}, ${tags[1]}, ${conjunction} ${tags.length - 2} others`
  }
}

/**
 * Fades the tagged elements under the target that fail the tag filter, and
 * hides their links so that they cannot be clicked or focused.
 */
export const renderTagsFilterStyle = ({
  targetId,
  tags,
  operator,
}: {
  targetId: string
  tags: readonly string[]
  operator: LogicalOperator
}): string => {
  const tagClassSelectors = tags.map(
    tag => `.${cssesc(createTagClassName(tag), { isIdentifier: true })}`,
  )
  const matchingTagsSelector =
    operator === `&&`
      ? tagClassSelectors.join(``)
      : `:is(${tagClassSelectors.join(`,`)})`
  const selector = `#${cssesc(targetId, { isIdentifier: true })} :is([class^='${TAG_CLASS_PREFIX}'], [class*=' ${TAG_CLASS_PREFIX}']):not(${matchingTagsSelector})`

  return `
    ${selector} {
      opacity: 0.25;
    }

    ${selector} > :is(a, button) {
      visibility: hidden;
    }

    ${selector} > :not(:is(a, button, dialog)) {
      display: initial;
    }
  `
}

export const createTagClassName = (tag: string): string =>
  `${TAG_CLASS_PREFIX}${tag.replaceAll(` `, `-`)}`

const TAG_CLASS_PREFIX = `tag:`

/**
 * Restyles the home page's default HTML into the given state. Every rule
 * targets a `data-home-*` attribute or id that the components render
 * regardless of state.
 */
export const renderPreloadStyle = (
  state: HomeState,
  data: HomeData,
): string => {
  const defaultPostId = getFirstPostId(data.posts, [])
  const post = data.posts.find(post => post.id === state.postId)!
  const home = `#${HOME_ELEMENT_ID}`
  const label = formatSelectedTags(state.tags, state.operator)

  const rules = [
    `${home} [data-home-post-title=${quote(defaultPostId)}] { display: none; }`,
    `${home} [data-home-post-title=${quote(state.postId)}] { display: inline; }`,
    `${home} [data-home-adjacent="previous"] { visibility: ${state.previousPostId ? `visible` : `hidden`}; }`,
    `${home} [data-home-adjacent="next"] { visibility: ${state.nextPostId ? `visible` : `hidden`}; }`,
    `#${HOME_GRAPH_ELEMENT_ID} { --home-graph-x: ${-100 * post.x}%; --home-graph-y: ${-100 * post.y}%; }`,
  ]

  for (const operator of [`||`, `&&`] as const) {
    const [input, text] =
      operator === state.operator
        ? [
            `z-index: 10; border-color: var(--color-blue-600);`,
            `color: var(--color-blue-700);`,
          ]
        : [
            `z-index: auto; border-color: var(--color-gray-300);`,
            `color: var(--color-gray-500);`,
          ]
    const selector = `${home} [data-home-operator=${quote(operator)}]`
    rules.push(
      `${selector} > input { ${input} }`,
      `${selector} > div { ${text} }`,
    )
  }

  if (label !== null) {
    rules.push(
      `${home} [data-home-tags-icon] { display: none; }`,
      `${home} [data-home-tags-label]::before { content: ${quote(label)}; }`,
      `${home} [data-home-tags-reset] { display: inline-block; }`,
      renderTagsFilterStyle({
        targetId: HOME_GRAPH_ELEMENT_ID,
        tags: state.tags,
        operator: state.operator,
      }),
    )
  }

  return rules.join(`\n`)
}

const quote = (value: string): string =>
  cssesc(value, { quotes: `double`, wrap: true })

export const HOME_ELEMENT_ID = `home`
export const HOME_GRAPH_ELEMENT_ID = `home-graph`
export const HOME_PRELOAD_STYLE_ID = `home-preload`
