import { any, entries, filter, join, map, pipe, values } from 'lfi'
import cssesc from 'cssesc'
import { Form } from 'react-router'
import { useCallback } from 'react'
import type { FormEventHandler } from 'react'
import type { LogicalOperator } from './logical-operator-radio-button-group.ts'
import {
  LogicalOperatorRadioButtonGroup,
  useLogicalOperator,
} from './logical-operator-radio-button-group.tsx'
import { TagsCheckboxGroup, useSelectedTags } from './tags-checkbox-group.tsx'

export const TagsFilterForm = ({
  targetId,
  tags,
}: {
  targetId: string
  tags: Set<string>
}) => {
  const [logicalOperator, setLogicalOperator] = useLogicalOperator()
  const [selectedTags, setSelectedTags] = useSelectedTags(tags)

  // Prevent form submission when JavaScript is enabled.
  const preventFormSubmission = useCallback<FormEventHandler<HTMLFormElement>>(
    e => e.preventDefault(),
    [],
  )

  return (
    <Form
      className='mx-auto flex max-w-[60ch] flex-col items-center gap-3'
      onSubmit={preventFormSubmission}
    >
      <div className='flex items-center gap-3'>
        <h2 className='text-lg font-medium'>Filter by tags</h2>
        <LogicalOperatorRadioButtonGroup
          logicalOperator={logicalOperator}
          setLogicalOperator={setLogicalOperator}
        />
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

const TagsFilterStyle = ({
  targetId,
  logicalOperator,
  selectedTags,
}: {
  targetId: string
  logicalOperator: LogicalOperator
  selectedTags: Record<string, boolean>
}) => {
  const escapedTargetId = cssesc(targetId, { isIdentifier: true })

  const tagClassSelectors = pipe(
    entries(selectedTags),
    filter(([, selected]) => selected),
    map(
      ([tag]) => `.${cssesc(createTagClassName(tag), { isIdentifier: true })}`,
    ),
  )
  const matchingTagsSelector =
    logicalOperator === `&&`
      ? join(``, tagClassSelectors)
      : `:is(${join(`,`, tagClassSelectors)})`
  const selector = `#${escapedTargetId} :is([class^='${TAG_CLASS_PREFIX}'], [class*=' ${TAG_CLASS_PREFIX}']):not(${matchingTagsSelector})`

  return (
    <style
      // Safe because all user inputted tags have been filtered to known tags
      // and the tags have been escaped for use in CSS identifiers.
      dangerouslySetInnerHTML={{
        __html: `
          ${selector} {
            opacity: 0.25;
          }

          ${selector} > :is(a, button) {
            display: none;
          }

          ${selector} > :not(:is(a, button, dialog)) {
            display: initial;
          }
        `,
      }}
    />
  )
}

export const createTagClassName = (tag: string): string =>
  `${TAG_CLASS_PREFIX}${tag.replaceAll(` `, `-`)}`

const TAG_CLASS_PREFIX = `tag:`
