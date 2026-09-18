import clsx from 'clsx'
import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from 'react'

export const Link = (props: LinkProps) =>
  isExternalUrl(props.href) ? (
    <ExternalLink {...props} />
  ) : (
    <InternalLink
      {...props}
      href={
        props.href.startsWith(`/`) || props.href.startsWith(`#`)
          ? props.href
          : `/${props.href}`
      }
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

const ExternalLink = ({ reloadDocument, ...rest }: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a
    {...withFocusRingClassName(rest)}
    target='_blank'
    rel='noopener noreferrer'
  />
)

const InternalLink = ({ reloadDocument, ...props }: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a {...withFocusRingClassName(props)} />
)

const withFocusRingClassName = <Props extends { className?: string }>({
  className,
  ...restProps
}: Props) => ({ ...restProps, className: clsx(className, `focus-ring`) })

export type LinkProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { href: string; children: ReactNode; reloadDocument?: boolean }
