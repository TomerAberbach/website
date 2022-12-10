import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react'
import { Link as RemixLink } from '@remix-run/react'
import clsx from 'clsx'

export const Link = (props: LinkProps) =>
  isExternalUrl(props.href) ? (
    <ExternalLink {...props} />
  ) : (
    <InternalLink {...props} />
  )

const isExternalUrl = (href: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(href)
    return true
  } catch {
    return false
  }
}

export const ExternalLink = (props: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a
    {...withFocusRingClassName(props)}
    target='_blank'
    rel='noopener noreferrer'
  />
)

export const InternalLink = ({ href, ...props }: LinkProps) =>
  typeof window === `undefined` || href.startsWith(`#`) ? (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a href={href} {...withFocusRingClassName(props)} />
  ) : (
    <RemixLink to={href} {...withFocusRingClassName(props)} />
  )

const withFocusRingClassName = <Props extends { className?: string }>({
  className,
  ...restProps
}: Props) => ({ ...restProps, className: clsx(className, `focus-ring`) })

export type LinkProps = Omit<Parameters<typeof RemixLink>[0], `to`> &
  DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > & { href: string; children: ReactNode }
