import type { ReactNode } from 'react'

const Tooltip = ({
  id,
  content,
  children,
}: {
  id?: string
  content: ReactNode
  children: ReactNode
}) => (
  <div className='relative'>
    {children}
    <div
      id={id}
      className="pointer-events-none absolute left-1/2 top-[calc(120%+8px)] z-10 w-max max-w-[20ch] -translate-x-1/2 rounded-md bg-gray-800 p-2 text-center text-sm text-white opacity-0 transition-opacity duration-200 after:absolute after:top-0 after:left-1/2 after:-translate-y-full after:-translate-x-1/2 after:border-8 after:border-solid after:border-transparent after:border-b-gray-800 after:content-[''] hover:pointer-events-auto hover:opacity-100 peer-hover:pointer-events-auto peer-hover:opacity-100 peer-focus-visible:pointer-events-auto peer-focus-visible:opacity-100"
    >
      {content}
    </div>
  </div>
)

export default Tooltip
