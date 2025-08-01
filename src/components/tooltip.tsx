import type { ReactNode } from 'react'
import { useId } from 'react'

const Tooltip = ({
  id,
  content,
  children,
}: {
  id?: string
  content: ReactNode
  children: ReactNode | ((tooltipId: string) => ReactNode)
}) => {
  if (id && typeof children === `function`) {
    children = children(id)
  }

  return typeof children === `function` ? (
    <TooltipWithGeneratedId content={content}>
      {children}
    </TooltipWithGeneratedId>
  ) : (
    <BaseTooltip id={id} content={content}>
      {children}
    </BaseTooltip>
  )
}

const TooltipWithGeneratedId = ({
  content,
  children,
}: {
  content: ReactNode
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
  content: ReactNode
  children: ReactNode
}) => (
  <span className='relative leading-[0]'>
    <span className='peer block h-full' tabIndex={-1}>
      {children}
    </span>
    <span
      id={id}
      className="pointer-events-none absolute top-[calc(120%+8px)] left-1/2 z-10 inline-block w-max -translate-x-1/2 rounded-md bg-gray-800 p-2 text-center text-xs text-white opacity-0 transition-opacity duration-200 peer-hover:pointer-events-auto peer-hover:opacity-100 peer-focus:pointer-events-auto peer-focus:opacity-100 peer-[:has(:focus-visible)]:pointer-events-auto peer-[:has(:focus-visible)]:opacity-100 after:absolute after:top-0 after:left-1/2 after:-translate-x-1/2 after:-translate-y-full after:border-8 after:border-solid after:border-transparent after:border-b-gray-800 after:content-[''] hover:pointer-events-auto hover:opacity-100"
      aria-hidden={Boolean(id)}
    >
      {content}
    </span>
  </span>
)

export default Tooltip
