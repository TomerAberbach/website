import type { Link } from '@remix-run/react'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import Layout from '../../src/components/layout'

jest.mock(`@remix-run/react`, () => ({
  Link: ({ to, ...props }: ComponentProps<typeof Link>) => (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a href={String(to)} {...props} />
  ),
}))

const renderLayout = () => render(<Layout>My Content!</Layout>)

test(`Layout renders a level 1 heading linking to the home page`, () => {
  renderLayout()

  const headingText = `Tomer Aberbach`
  const heading = screen.getByRole(`heading`, { level: 1, name: headingText })
  const homeLink = screen.getByRole(`link`, { name: headingText })
  expect(heading.parentElement).toBe(homeLink)
  expect(homeLink).toHaveAttribute(`href`, `/`)
  expect(homeLink).not.toHaveAttribute(`target`)
})

test(`Layout renders external links to social media`, () => {
  renderLayout()

  const socialMediaLinks = [
    [`GitHub`, `https://github.com/TomerAberbach`],
    [`Spotify`, `https://open.spotify.com/artist/0XwEUC5NdlGHZ9jpfHNeB7`],
    [`Twitter`, `https://twitter.com/TomerAberbach`],
    [`LinkedIn`, `https://www.linkedin.com/in/tomer-a`],
  ] as const
  for (const [name, href] of socialMediaLinks) {
    const link = screen.getByRole(`link`, { name })
    expect(link).toHaveAttribute(`href`, href)
    expect(link).toHaveAttribute(`target`, `_blank`)
  }
})
