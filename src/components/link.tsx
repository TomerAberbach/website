import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react'
import { Link as RemixLink } from '@remix-run/react'

export const Link = (props: LinkProps) =>
  props.href.startsWith(`/`) ? (
    <InternalLink {...props} />
  ) : (
    <ExternalLink {...props} />
  )

export const ExternalLink = (props: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a {...props} target='_blank' rel='noopener noreferrer' />
)

export const InternalLink = ({ href, ...props }: LinkProps) => (
  <RemixLink to={href} {...props} />
)

type LinkProps = Omit<Parameters<typeof RemixLink>[0], `to`> &
  DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > & { href: string; children: ReactNode }
