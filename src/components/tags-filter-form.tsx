import { join, map, pipe } from 'lfi'
import cssesc from 'cssesc'
import { Form } from 'react-router'
import { useCallback } from 'react'
import type { FormEventHandler } from 'react'
import type { LogicalOperator } from './logical-operator-radio-button-group.ts'
import {
  LogicalOperatorRadioButtonGroup,
  useLogicalOperator,
} from './logical-operator-radio-button-group.tsx'
import { TagsListbox, useSelectedTags } from './tags-listbox.tsx'

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
      className='mx-auto flex max-w-full flex-col items-center gap-2'
      onSubmit={preventFormSubmission}
    >
      <h2 className='text-lg font-medium text-gray-700'>Filter by tags</h2>
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
  selectedTags: string[]
}) => {
  const escapedTargetId = cssesc(targetId, { isIdentifier: true })

  const tagClassSelectors = pipe(
    selectedTags,
    map(tag => `.${cssesc(createTagClassName(tag), { isIdentifier: true })}`),
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
            visibility: hidden;
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
