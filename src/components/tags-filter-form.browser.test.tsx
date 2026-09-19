import { expect, test } from 'vitest'
import { page } from 'vitest/browser'
import { TagsFilterForm } from './tags-filter-form.tsx'
import { createTagClassName } from '~/services/home-state.ts'
import {
  renderAtUrl,
  searchParamsProbe,
  searchParamsText,
} from '~/test/url.tsx'

const TAGS = [`a`, `b`, `c`, `d`, `e`]

const renderForm = (url: string) =>
  renderAtUrl(<TagsFilterForm targetId='graph' tags={TAGS} />, { url })

test(`tags and operator in the URL are selected on load`, async () => {
  await renderForm(`/?tags=b,a&op=and`)

  await expect
    .element(page.getByRole(`button`, { name: `a and b` }))
    .toBeInTheDocument()
  await expect.element(page.getByRole(`radio`, { name: `&&` })).toBeChecked()
})

test(`unknown tags in the URL are ignored`, async () => {
  await renderForm(`/?tags=a,zzz`)

  await expect
    .element(page.getByRole(`button`, { name: `a` }))
    .toBeInTheDocument()
})

test(`choosing an option adds the tag to the URL in sorted order and drops the post`, async () => {
  await renderForm(`/?post=some-post&tags=c`)

  await page.getByRole(`button`, { name: `c` }).click()
  await page.getByRole(`option`, { name: `a` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({ tags: `a,c` }))
})

test(`reset clears the tags, focuses the listbox button, and announces`, async () => {
  await renderForm(`/?tags=a,b`)

  await page.getByRole(`button`, { name: `Reset` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({}))
  await expect
    .element(page.getByRole(`button`, { name: `Filter` }))
    .toHaveFocus()
  await expect
    .element(page.getByRole(`alert`))
    .toHaveTextContent(`All tags not selected`)
})

test(`choosing && sets op in the URL`, async () => {
  await renderForm(`/?tags=a`)

  await page.getByRole(`radio`, { name: `&&` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({ tags: `a`, op: `and` }))
})

test(`choosing || removes op from the URL`, async () => {
  await renderForm(`/?tags=a&op=and`)

  await page.getByRole(`radio`, { name: `||` }).click()

  await expect
    .element(searchParamsProbe())
    .toHaveTextContent(searchParamsText({ tags: `a` }))
})

test.each([
  [`a`, ``, `a`],
  [`a,b`, ``, `a or b`],
  [`a,b`, `&op=and`, `a and b`],
  [`a,b,c`, ``, `a, b, or c`],
  [`a,b,c,d`, ``, `a, b, or 2 others`],
])(
  `the listbox button summarizes tags %s with operator %s as %s`,
  async (tags, operator, text) => {
    await renderForm(`/?tags=${tags}${operator}`)

    await expect
      .element(page.getByRole(`button`, { name: text }))
      .toBeInTheDocument()
  },
)

test(`three tags are summarized with a count when that form is shorter`, async () => {
  const longTags = [`alpha-long`, `beta-long`, `gamma-long`]

  await renderAtUrl(<TagsFilterForm targetId='graph' tags={longTags} />, {
    url: `/?tags=alpha-long,beta-long,gamma-long&op=and`,
  })

  await expect
    .element(page.getByRole(`button`, { name: `alpha-long and 2 others` }))
    .toBeInTheDocument()
})

const FilteredElements = () => (
  <div id='graph'>
    <div data-testid='only-a' className={createTagClassName(`a`)}>
      <a data-testid='only-a-link' href='/a'>
        only a
      </a>
    </div>
    <div
      data-testid='a-and-b'
      className={`${createTagClassName(`a`)} ${createTagClassName(`b`)}`}
    >
      <a data-testid='a-and-b-link' href='/ab'>
        a and b
      </a>
    </div>
    <div data-testid='only-c' className={createTagClassName(`c`)}>
      <a data-testid='only-c-link' href='/c'>
        only c
      </a>
    </div>
    <div data-testid='untagged'>
      <a data-testid='untagged-link' href='/none'>
        untagged
      </a>
    </div>
  </div>
)

const renderFormWithFilteredElements = (url: string) =>
  renderAtUrl(
    <>
      <TagsFilterForm targetId='graph' tags={TAGS} />
      <FilteredElements />
    </>,
    { url },
  )

const FADED = { opacity: `0.25` }
const UNFADED = { opacity: `1` }

test.each([
  [`||`, `/?tags=a,b`, { onlyA: UNFADED, aAndB: UNFADED, onlyC: FADED }],
  [`&&`, `/?tags=a,b&op=and`, { onlyA: FADED, aAndB: UNFADED, onlyC: FADED }],
])(
  `with %s the stylesheet fades tagged elements that fail the filter`,
  async (_, url, { onlyA, aAndB, onlyC }) => {
    await renderFormWithFilteredElements(url)

    await expect.element(page.getByTestId(`only-a`)).toHaveStyle(onlyA)
    await expect.element(page.getByTestId(`a-and-b`)).toHaveStyle(aAndB)
    await expect.element(page.getByTestId(`only-c`)).toHaveStyle(onlyC)
    await expect.element(page.getByTestId(`untagged`)).toHaveStyle(UNFADED)
  },
)

test(`the stylesheet hides links inside faded elements`, async () => {
  await renderFormWithFilteredElements(`/?tags=a`)

  await expect
    .element(page.getByTestId(`only-c-link`))
    .toHaveStyle({ visibility: `hidden` })
  await expect
    .element(page.getByTestId(`only-a-link`))
    .toHaveStyle({ visibility: `visible` })
})

test(`nothing is faded without selected tags`, async () => {
  await renderFormWithFilteredElements(`/`)

  await expect.element(page.getByTestId(`only-c`)).toHaveStyle(UNFADED)
})
