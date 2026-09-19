import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { PostSwitcher, useSelectedPostId } from './post-switcher.tsx'
import { getHomeData } from '~/services/home-state.ts'
import { createGraph } from '~/test/graph.ts'
import {
  renderAtUrl,
  searchParamsProbe,
  searchParamsText,
} from '~/test/url.tsx'

// Newest first, as `getOrderedPosts` orders them.
const GRAPH = createGraph({
  posts: [
    { id: `newest`, tags: [`music`] },
    { id: `middle`, tags: [`code`] },
    { id: `oldest`, tags: [`music`, `code`] },
  ],
})
const DATA = getHomeData(GRAPH.vertices.keys(), GRAPH)

const renderSwitcher = ({
  selectedPostId,
  setSelectedPostId = () => {},
  url = `/`,
}: {
  selectedPostId: string
  setSelectedPostId?: (postId: string) => void
  url?: string
}) =>
  renderAtUrl(
    <PostSwitcher
      selectedPostId={selectedPostId}
      setSelectedPostId={setSelectedPostId}
      data={DATA}
      graph={GRAPH}
      graphId='graph'
    />,
    { url },
  )

const button = (name: `Previous post` | `Next post`) =>
  // A disabled button is hidden, so include hidden elements.
  page.getByRole(`button`, { name, includeHidden: true })

test(`the selected post's title links to the post`, async () => {
  await renderSwitcher({ selectedPostId: `middle` })

  await expect
    .element(page.getByRole(`link`, { name: `Post middle` }))
    .toHaveAttribute(`href`, `/middle`)
})

test.each([
  [`Previous post`, `oldest`],
  [`Next post`, `newest`],
] as const)(
  `the %s button selects the adjacent post`,
  async (name, adjacentPostId) => {
    const setSelectedPostId = vi.fn()
    await renderSwitcher({ selectedPostId: `middle`, setSelectedPostId })

    await button(name).click()

    expect(setSelectedPostId).toHaveBeenCalledWith(adjacentPostId)
  },
)

test(`the previous button skips posts that fail the tag filter`, async () => {
  const setSelectedPostId = vi.fn()
  await renderSwitcher({
    selectedPostId: `newest`,
    setSelectedPostId,
    url: `/?tags=music`,
  })

  await button(`Previous post`).click()

  expect(setSelectedPostId).toHaveBeenCalledWith(`oldest`)
})

test.each([
  [`Previous post`, `oldest`],
  [`Next post`, `newest`],
] as const)(
  `the %s button is disabled at the end of the chain`,
  async (name, selectedPostId) => {
    await renderSwitcher({ selectedPostId })

    await expect.element(button(name)).toBeDisabled()
  },
)

test(`the next button is disabled when no remaining post passes the tag filter`, async () => {
  await renderSwitcher({ selectedPostId: `middle`, url: `/?tags=code` })

  await expect.element(button(`Next post`)).toBeDisabled()
})

const SelectedPostProbe = ({ postIdToSelect }: { postIdToSelect: string }) => {
  const [selectedPostId, setSelectedPostId] = useSelectedPostId(DATA)
  return (
    <>
      <div data-testid='selected-post'>{selectedPostId}</div>
      <button type='button' onClick={() => setSelectedPostId(postIdToSelect)}>
        Select
      </button>
    </>
  )
}

test.each([
  [`/`, `newest`],
  [`/?post=middle`, `middle`],
  [`/?post=unknown`, `newest`],
  [`/?tags=code`, `middle`],
  [`/?post=unknown&tags=code`, `middle`],
])(`at %s the selected post is %s`, async (url, selectedPostId) => {
  await renderAtUrl(<SelectedPostProbe postIdToSelect='newest' />, {
    url,
  })

  await expect
    .element(page.getByTestId(`selected-post`))
    .toHaveTextContent(selectedPostId)
})

test(`selecting a post other than the first stores it in the URL`, async () => {
  await renderAtUrl(<SelectedPostProbe postIdToSelect='oldest' />)

  await page.getByRole(`button`, { name: `Select` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({ post: `oldest` }))
})

test(`selecting the first post removes it from the URL`, async () => {
  await renderAtUrl(<SelectedPostProbe postIdToSelect='newest' />, {
    url: `/?post=oldest`,
  })

  await page.getByRole(`button`, { name: `Select` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({}))
})

test(`selecting an unknown post falls back to the first post`, async () => {
  await renderAtUrl(<SelectedPostProbe postIdToSelect='unknown' />, {
    url: `/?post=oldest`,
  })

  await page.getByRole(`button`, { name: `Select` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({}))
})
