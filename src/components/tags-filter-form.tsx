import { any, entries, filter, join, map, pipe, values } from 'lfi'
import cssesc from 'cssesc'
import { Form } from '@remix-run/react'
import type { LogicalOperator } from './logical-operator-radio-button-group.js'
import {
  LogicalOperatorRadioButtonGroup,
  useLogicalOperator,
} from './logical-operator-radio-button-group.js'
import { TagsCheckboxGroup, useSelectedTags } from './tags-checkbox-group.js'

const TagsFilterForm = ({
  targetId,
  tags,
}: {
  targetId: string
  tags: Set<string>
}) => {
  const [logicalOperator, setLogicalOperator] = useLogicalOperator()
  const [selectedTags, setSelectedTags] = useSelectedTags(tags)

  return (
    <Form className='mx-auto flex max-w-[60ch] flex-col items-center gap-3'>
      <div className='flex items-center gap-3'>
        <h2 className='text-lg font-medium'>Filter by tags</h2>
        {
          <LogicalOperatorRadioButtonGroup
            logicalOperator={logicalOperator}
            setLogicalOperator={setLogicalOperator}
          />
        }
      </div>
      <TagsCheckboxGroup
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
      {pipe(
        values(selectedTags),
        any(selected => selected),
      ) && (
        <TagsFilterStyle
          targetId={targetId}
          logicalOperator={logicalOperator}
          selectedTags={selectedTags}
        />
      )}
    </Form>
  )
}

export default TagsFilterForm

const TagsFilterStyle = ({
  targetId,
  logicalOperator,
  selectedTags,
}: {
  targetId: string
  logicalOperator: LogicalOperator
  selectedTags: Record<string, boolean>
}) => {
  const tagClassSelectors = pipe(
    entries(selectedTags),
    filter(([, selected]) => selected),
    map(([tag]) => `.${cssesc(`tag:${tag}`, { isIdentifier: true })}`),
  )

  const matchingTagsSelector =
    logicalOperator === `&&`
      ? join(``, tagClassSelectors)
      : `:is(${join(`,`, tagClassSelectors)})`

  const escapedTargetId = cssesc(targetId, { isIdentifier: true })
  return (
    <style
      // Safe because all user inputted tags have been filtered to known tags
      // and the tags have been escaped for use in CSS identifiers
      dangerouslySetInnerHTML={{
        __html: `
          #${escapedTargetId} :is(line,a):not(${matchingTagsSelector}){opacity:0.25;}`,
      }}
    />
  )
}
