import clsx from 'clsx'
import type { AnchorHTMLAttributes } from 'preact'
import type { ReactNode } from 'preact/compat'

// The site is a multi-page app under Astro, so links are plain anchors (every
// navigation is a full document load).
export type LinkProps = Omit<AnchorHTMLAttributes, `className`> & {
  href: string
  className?: string
  children?: ReactNode
}

const isExternalUrl = (href: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(href)
    return true
  } catch {
    return false
  }
}

export const ExternalLink = ({ className, ...rest }: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a
    {...rest}
    className={clsx(className, `focus-ring`)}
    target='_blank'
    rel='noopener noreferrer'
  />
)

export const InternalLink = ({ href, className, ...rest }: LinkProps) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a
    {...rest}
    href={href.startsWith(`/`) || href.startsWith(`#`) ? href : `/${href}`}
    className={clsx(className, `focus-ring`)}
  />
)

export const Link = (props: LinkProps) =>
  isExternalUrl(props.href) ? (
    <ExternalLink {...props} />
  ) : (
    <InternalLink {...props} />
  )
