import type { ReactNode } from 'preact/compat'
import { useId } from 'preact/compat'

const Tooltip = ({
  id,
  content,
  children,
}: {
  id?: string
  // Optional because `.astro` callers supply it via a `content` named slot,
  // which Astro maps to this prop at runtime but TypeScript can't see.
  content?: ReactNode
  children: ReactNode | ((tooltipId: string) => ReactNode)
}) => {
  const resolvedChildren =
    id && typeof children === `function`
      ? (children as (tooltipId: string) => ReactNode)(id)
      : children

  return typeof resolvedChildren === `function` ? (
    <TooltipWithGeneratedId content={content}>
      {resolvedChildren as (tooltipId: string) => ReactNode}
    </TooltipWithGeneratedId>
  ) : (
    <BaseTooltip id={id} content={content}>
      {resolvedChildren}
    </BaseTooltip>
  )
}

const TooltipWithGeneratedId = ({
  content,
  children,
}: {
  content?: ReactNode
  children: (tooltipId: string) => ReactNode
}) => {
  const id = useId()
  return (
    <BaseTooltip id={id} content={content}>
      {children(id)}
    </BaseTooltip>
  )
}

const BaseTooltip = ({
  id,
  content,
  children,
}: {
  id?: string
  content?: ReactNode
  children: ReactNode
}) => (
  <span className='relative inline-flex'>
    <span className='peer' tabIndex={-1}>
      {children}
    </span>
    <span
      id={id}
      className="pointer-events-none absolute top-full left-1/2 z-10 mt-2 inline-block w-max -translate-x-1/2 rounded-md bg-gray-800 p-2 text-center text-xs text-white opacity-0 transition-opacity duration-200 peer-hover:pointer-events-auto peer-hover:opacity-100 peer-focus:pointer-events-auto peer-focus:opacity-100 peer-[:has(:focus-visible)]:pointer-events-auto peer-[:has(:focus-visible)]:opacity-100 after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:-translate-y-full after:border-8 after:border-solid after:border-transparent after:border-b-gray-800 after:content-[''] hover:pointer-events-auto hover:opacity-100"
      aria-hidden={Boolean(id)}
    >
      {content}
    </span>
  </span>
)

export default Tooltip
