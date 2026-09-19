import { useCallback } from 'react'
import type { FormEventHandler } from 'react'
import {
  LogicalOperatorRadioButtonGroup,
  useLogicalOperator,
} from './logical-operator-radio-button-group.tsx'
import { TagsListbox, useSelectedTags } from './tags-listbox.tsx'
import { renderTagsFilterStyle } from '~/services/home-state.ts'
import type { LogicalOperator } from '~/services/home-state.ts'

export const TagsFilterForm = ({
  targetId,
  tags,
}: {
  targetId: string
  tags: readonly string[]
}) => {
  const [logicalOperator, setLogicalOperator] = useLogicalOperator()
  const [selectedTags, setSelectedTags] = useSelectedTags(tags)

  // Prevent form submission when JavaScript is enabled.
  const preventFormSubmission = useCallback<FormEventHandler<HTMLFormElement>>(
    e => e.preventDefault(),
    [],
  )

  return (
    <form
      action='/'
      method='get'
      className='mx-auto flex max-w-full flex-col items-center gap-2'
      onSubmit={preventFormSubmission}
    >
      <div className='flex max-w-full items-stretch gap-2'>
        <TagsListbox
          tags={tags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
        <LogicalOperatorRadioButtonGroup
          logicalOperator={logicalOperator}
          setLogicalOperator={setLogicalOperator}
        />
      </div>
      {selectedTags.length > 0 && (
        <TagsFilterStyle
          targetId={targetId}
          logicalOperator={logicalOperator}
          selectedTags={selectedTags}
        />
      )}
    </form>
  )
}

const TagsFilterStyle = ({
  targetId,
  logicalOperator,
  selectedTags,
}: {
  targetId: string
  logicalOperator: LogicalOperator
  selectedTags: string[]
}) => (
  <style
    // Safe because all user inputted tags have been filtered to known tags
    // and the tags have been escaped for use in CSS identifiers.
    dangerouslySetInnerHTML={{
      __html: renderTagsFilterStyle({
        targetId,
        tags: selectedTags,
        operator: logicalOperator,
      }),
    }}
  />
)
