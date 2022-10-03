import { render, screen } from '@testing-library/react'
import ExternalLink from '../../src/components/external-link'

test(`ExternalLink renders an external link to the given href`, () => {
  const href = `https://tomeraberba.ch`

  render(<ExternalLink href={href} />)

  const link = screen.getByRole(`link`)
  expect(link).toHaveAttribute(`href`, href)
  expect(link).toHaveAttribute(`target`, `_blank`)
  expect(link).toHaveAttribute(`rel`, `noopener noreferrer`)
})
