import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import clsx from 'clsx'

export const Link = (props: LinkProps) =>
  isExternalUrl(props.href) ? (
    <ExternalLink {...props} />
  ) : (
    <InternalLink
      {...props}
      href={props.href.startsWith(`/`) ? props.href : `/${props.href}`}
    />
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

export const ExternalLink = ({ reloadDocument, ...rest }: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a
    {...withFocusRingClassName(rest)}
    target='_blank'
    rel='noopener noreferrer'
  />
)

export const InternalLink = ({ href, reloadDocument, ...props }: LinkProps) =>
  typeof window === `undefined` ? (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a data-discover='true' href={href} {...withFocusRingClassName(props)} />
  ) : (
    <RouterLink
      to={href}
      reloadDocument={reloadDocument}
      {...withFocusRingClassName(props)}
    />
  )

const withFocusRingClassName = <Props extends { className?: string }>({
  className,
  ...restProps
}: Props) => ({ ...restProps, className: clsx(className, `focus-ring`) })

export type LinkProps = Omit<Parameters<typeof RouterLink>[0], `to`> &
  DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > & { href: string; children: ReactNode }
