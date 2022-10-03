import type { AnchorHTMLAttributes, DetailedHTMLProps } from 'react'

export default function ExternalLink({
  children,
  ...props
}: { href: string } & Omit<
  DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
  `target` | `rel`
>) {
  return (
    <a {...props} target='_blank' rel='noopener noreferrer'>
      {children}
    </a>
  )
}
