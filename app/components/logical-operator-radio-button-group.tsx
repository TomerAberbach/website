import type { ChangeEventHandler } from 'react'
import { useCallback, useId } from 'react'
import { useSearchParams } from 'react-router'
import { arrayIncludes } from 'ts-extras'
import Tooltip from './tooltip.tsx'

export const LogicalOperatorRadioButtonGroup = ({
  logicalOperator,
  setLogicalOperator,
}: {
  logicalOperator: LogicalOperator
  setLogicalOperator: (newLogicalOperator: LogicalOperator) => void
}) => {
  const tooltipId = useId()

  const handleLogicalOperatorChange = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >(
    event => {
      const { value } = event.target
      setLogicalOperator(arrayIncludes(LOGICAL_OPERATORS, value) ? value : `||`)
    },
    [setLogicalOperator],
  )

  return (
    <div className='flex items-center gap-1.5'>
      <fieldset aria-describedby={tooltipId}>
        <legend className='sr-only'>Logical operator</legend>
        <div className='flex -space-x-[2px] rounded-2xl'>
          {LOGICAL_OPERATORS.map(currentLogicalOperator => {
            const checked = currentLogicalOperator === logicalOperator
            return (
              <label
                key={currentLogicalOperator}
                className='group relative text-center font-mono font-medium leading-none first:rounded-l-xl last:rounded-r-xl'
              >
                <input
                  type='radio'
                  name='op'
                  value={currentLogicalOperator}
                  checked={checked}
                  className='focus-ring peer absolute left-0 top-0 h-full w-full cursor-pointer appearance-none border-2 border-gray-300 checked:z-10 checked:border-blue-600 hover:z-20 hover:ring-3 focus-visible:z-20 group-first:rounded-l-xl group-last:rounded-r-xl'
                  onChange={handleLogicalOperatorChange}
                />
                <div className='h-full w-full bg-white p-2 text-gray-500 transition group-first:rounded-l-xl group-last:rounded-r-xl peer-checked:text-blue-700 peer-hover:bg-blue-50 peer-active:bg-blue-100'>
                  {currentLogicalOperator}
                </div>
              </label>
            )
          })}
        </div>
      </fieldset>
      <Tooltip
        content={
          <div className='max-w-[20ch]'>
            <span className='font-mono'>||</span> and{` `}
            <span className='font-mono'>&&</span> filter for posts matching{` `}
            <em>any</em> and <em>all</em> of the tags, respectively
          </div>
        }
      >
        <QuestionMarkCircleIcon />
      </Tooltip>
    </div>
  )
}

const QuestionMarkCircleIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    className='h-5 w-5 lg:h-6 lg:w-6'
    aria-hidden
  >
    <path
      fillRule='evenodd'
      d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z'
      clipRule='evenodd'
    />
  </svg>
)

export const useLogicalOperator = (): [
  LogicalOperator,
  (newLogicalOperator: LogicalOperator) => void,
] => {
  const [searchParams, setSearchParams] = useSearchParams()

  const logicalOperator = searchParams.get(`op`) === `and` ? `&&` : `||`
  const setLogicalOperator = useCallback(
    (newLogicalOperator: LogicalOperator) => {
      const newSearchParams = new URLSearchParams(searchParams)

      if (newLogicalOperator === `&&`) {
        newSearchParams.set(`op`, `and`)
      } else {
        newSearchParams.delete(`op`)
      }

      setSearchParams(newSearchParams, {
        replace: true,
        preventScrollReset: true,
      })
    },
    [searchParams, setSearchParams],
  )

  return [logicalOperator, setLogicalOperator]
}

const LOGICAL_OPERATORS: readonly LogicalOperator[] = [`||`, `&&`]
export type LogicalOperator = `||` | `&&`
