import type { ChangeEventHandler } from 'react'
import { useCallback, useId } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid'
import { useSearchParams } from '@remix-run/react'
import { arrayIncludes } from 'ts-extras'
import Tooltip from './tooltip.js'

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
                  className='focus-ring peer absolute left-0 top-0 h-full w-full cursor-pointer appearance-none border-2 border-gray-300 checked:z-10 checked:border-blue-600 hover:z-20 hover:ring focus-visible:z-20 group-first:rounded-l-xl group-last:rounded-r-xl'
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
        <QuestionMarkCircleIcon className='h-5 w-5 lg:h-6 lg:w-6' />
      </Tooltip>
    </div>
  )
}

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
        state: { scroll: false },
      })
    },
    [searchParams, setSearchParams],
  )

  return [logicalOperator, setLogicalOperator]
}

const LOGICAL_OPERATORS: readonly LogicalOperator[] = [`||`, `&&`]
export type LogicalOperator = `||` | `&&`
