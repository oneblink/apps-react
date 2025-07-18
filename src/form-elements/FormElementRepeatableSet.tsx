import * as React from 'react'
import clsx from 'clsx'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import generateDefaultData, {
  ENTRY_ID_PROPERTY_NAME,
  generateNewRepeatableSetEntry,
} from '../services/generate-default-data'
import OneBlinkFormElements from '../components/renderer/OneBlinkFormElements'
import Modal from '../components/renderer/Modal'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useValidationClass from '../hooks/useValidationClass'
import {
  ExecutedLookups,
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValidation,
  NestedFormElementValueChangeHandler,
  IsDirtyProps,
  UpdateFormElementsHandler,
  SectionState,
} from '../types/form'
import useFormElementRepeatableSetEntries from '../hooks/useFormElementRepeatableSetEntries'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'
import ElementDOMId from '../utils/elementDOMIds'
import { Collapse } from '@mui/material'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  formId: number
  id: string
  isEven: boolean
  element: FormTypes.RepeatableSetElement
  value: Array<SubmissionTypes.S3SubmissionData['submission']> | undefined
  onChange: NestedFormElementValueChangeHandler<
    SubmissionTypes.S3SubmissionData['submission'][]
  >
  onLookup: FormElementLookupHandler
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  onUpdateFormElements: UpdateFormElementsHandler
  sectionState: SectionState
} & IsDirtyProps

const RepeatableSetIndexContext = React.createContext<number>(0)

function RepeatableSetEntryProvider({
  index,
  isAnimated,
  element,
  idPrefix,
  onRemove,
  children,
}: {
  isAnimated: boolean
  index: number
  element: FormTypes.RepeatableSetElement
  idPrefix?: string
  onRemove: (
    index: number,
    element: FormTypes.RepeatableSetElement,
    idPrefix?: string,
  ) => void
  children: (renderProps: { onRemove: () => void }) => React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = React.useState(true)

  const handleRemove = React.useCallback(() => {
    if (isAnimated) {
      setIsExpanded(false)
    } else {
      onRemove(index, element, idPrefix)
    }
  }, [index, isAnimated, onRemove, element, idPrefix])

  const node = (
    <RepeatableSetIndexContext.Provider value={index}>
      {children({
        onRemove: handleRemove,
      })}
    </RepeatableSetIndexContext.Provider>
  )

  if (!isAnimated) {
    return node
  }

  return (
    <Collapse
      in={isExpanded}
      appear
      onExited={() => {
        onRemove(index, element, idPrefix)
      }}
      classes={{
        root: 'ob-repeatable-set__collapsible',
        wrapper: 'ob-repeatable-set__collapsible-wrapper',
        wrapperInner: 'ob-repeatable-set__collapsible-wrapper-inner',
      }}
    >
      {node}
    </Collapse>
  )
}

export function useRepeatableSetIndexText(text: string) {
  const index = React.useContext(RepeatableSetIndexContext)
  return React.useMemo(
    () => text.replace('{INDEX}', (index + 1).toString()),
    [index, text],
  )
}

function FormElementRepeatableSet({
  formId,
  element,
  value,
  formElementValidation,
  id,
  isEven,
  displayValidationMessage,
  formElementConditionallyShown,
  onChange,
  onLookup,
  onUpdateFormElements,
  isDirty,
  setIsDirty,
  sectionState,
}: Props) {
  const entries = React.useMemo(
    () => (Array.isArray(value) ? value : []),
    [value],
  )

  const handleAddEntry = React.useCallback(
    (index: number) => {
      onChange(element, {
        value: (existingEntries) => {
          const newEntries = [...(existingEntries || [])]
          const entry = generateDefaultData(
            element.elements,
            generateNewRepeatableSetEntry(),
          )

          newEntries.splice(index, 0, entry)
          return newEntries
        },
        executedLookups: (existingExecutedLookups) => {
          if (
            existingExecutedLookups !== undefined &&
            !Array.isArray(existingExecutedLookups)
          ) {
            return []
          }

          const newExistingExecutedLookups = [
            ...((existingExecutedLookups as ExecutedLookups[]) ??
              Array.from(Array(entries.length))),
          ]
          newExistingExecutedLookups.push({})
          return newExistingExecutedLookups
        },
        sectionState: (currentSectionState) => {
          return (
            currentSectionState?.map((section) => {
              const idPrefixPattern = new RegExp(
                `(.+)?${element.name}_entry-(.+)_(.+)`,
              )
              const entryIdPrefixMatches = section.id.match(idPrefixPattern)

              if (entryIdPrefixMatches) {
                const startOfId = entryIdPrefixMatches[1]
                const entryIndex = parseInt(entryIdPrefixMatches[2])
                const restOfId = entryIdPrefixMatches[3]

                if (entryIndex >= index) {
                  const newEntryIndex = entryIndex + 1
                  section.id = `${startOfId ? startOfId : ''}${element.name}_entry-${newEntryIndex}_${restOfId}`
                }
              }

              return section
            }, []) || []
          )
        },
      })
      setIsDirty()
    },
    [element, onChange, setIsDirty, entries.length],
  )

  const handleRemoveEntry = React.useCallback(
    (
      index: number,
      element: FormTypes.RepeatableSetElement,
      idPrefix?: string,
    ) => {
      const entryIdPrefix = idPrefix || ''

      onChange(element, {
        value: (existingEntries) => {
          const newEntries = [...(existingEntries || [])]
          newEntries.splice(index, 1)
          return newEntries
        },
        executedLookups: (existingExecutedLookups) => {
          if (!Array.isArray(existingExecutedLookups)) {
            return []
          }
          const newExistingExecutedLookups = [...existingExecutedLookups]

          newExistingExecutedLookups.splice(index, 1)
          return newExistingExecutedLookups
        },
        sectionState: (currentSectionState) => {
          return (
            currentSectionState?.reduce(
              (
                state: {
                  id: string
                  state: 'COLLAPSED' | 'EXPANDED'
                }[],
                section,
              ) => {
                const idPrefixPattern = new RegExp(
                  `(.+)?${element.name}_entry-(\\d+)`,
                )
                const entryIdPrefixMatches =
                  entryIdPrefix.match(idPrefixPattern)
                if (
                  !section.id.startsWith(entryIdPrefix) &&
                  entryIdPrefixMatches
                ) {
                  const parentElementPath =
                    entryIdPrefixMatches[1] || `${element.name}_entry`
                  // only update nested sections where the parent path matches the entry that was removed
                  if (section.id.startsWith(parentElementPath)) {
                    // Match pattern: {elementName}_entry-{index}_
                    // also yields a prefix and suffix for any match found
                    const idPrefixWithFullIdPattern = new RegExp(
                      `(.+)?${element.name}_entry-(\\d+)_(.+)`,
                    )
                    const match = section.id.match(idPrefixWithFullIdPattern)

                    if (match) {
                      const oldEntryIndex = parseInt(match[2], 10)
                      if (oldEntryIndex > index) {
                        const prefix = match[1]
                        const restOfId = match[3]
                        const newEntryIndex = oldEntryIndex - 1
                        section.id = `${prefix ? prefix : ''}${element.name}_entry-${newEntryIndex}_${restOfId}`
                      }
                    }
                  }

                  state.push(section)
                }

                return state
              },
              [],
            ) || []
          )
        },
      })
      setIsDirty()
    },
    [onChange, setIsDirty],
  )

  const handleNestedChange = React.useCallback(
    (
      index: number,
      nestedElement: FormTypes.FormElement,
      {
        value,
        executedLookups,
        sectionState,
      }: Parameters<NestedFormElementValueChangeHandler>[1],
      idPrefix?: string,
    ) => {
      if (nestedElement.type === 'section') {
        // trigger onChange to update sectionState
        onChange(
          {
            ...nestedElement,
            id: idPrefix ? `${idPrefix}${nestedElement.id}` : nestedElement.id,
          },
          { executedLookups: undefined, sectionState },
        )
      }
      if (!('name' in nestedElement)) {
        return
      }
      onChange(element, {
        value: (existingEntries) => {
          const newEntries = (existingEntries || []).map((entry, i) => {
            if (i === index) {
              return {
                ...entry,
                [nestedElement.name]:
                  typeof value === 'function'
                    ? value(entry[nestedElement.name])
                    : value,
              }
            } else {
              return entry
            }
          })
          return newEntries
        },
        executedLookups: (existingExecutedLookups) => {
          const elementExecutedLookups = existingExecutedLookups ?? []
          if (!Array.isArray(elementExecutedLookups)) {
            return elementExecutedLookups
          }
          const newExecutedLookups = elementExecutedLookups.map(
            (executedLookup, i) => {
              if (i === index) {
                const updatedExecutedLookups =
                  typeof executedLookups === 'function'
                    ? executedLookups(executedLookup?.[nestedElement.name])
                    : executedLookups
                return {
                  ...executedLookup,
                  [nestedElement.name]: updatedExecutedLookups,
                }
              }
              return executedLookup
            },
          )
          return newExecutedLookups
        },
        sectionState,
      })
    },
    [element, onChange],
  )

  const { minSetEntries, maxSetEntries } =
    useFormElementRepeatableSetEntries(element)

  const repeatableSetValidation = React.useMemo(
    () =>
      !formElementValidation ||
      typeof formElementValidation === 'string' ||
      formElementValidation.type !== 'repeatableSet'
        ? undefined
        : formElementValidation,
    [formElementValidation],
  )

  const repeatableSetEntriesConditionallyShown =
    formElementConditionallyShown &&
    formElementConditionallyShown.type === 'repeatableSet'
      ? formElementConditionallyShown.entries
      : {}

  const { validationClassName } = useValidationClass({
    formElementsValid: !repeatableSetValidation,
    displayInvalidClassName: isDirty || displayValidationMessage,
    validClassName: 'ob-repeatable-set-element__valid',
    invalidClassName: 'ob-repeatable-set-element__invalid',
  })

  const ariaDescribedby = useElementAriaDescribedby(id, element)

  const showAddButton = React.useMemo(
    () => !maxSetEntries || entries.length < maxSetEntries,
    [maxSetEntries, entries.length],
  )

  const repeatableSetContainerClass = React.useMemo(() => {
    const prefix = 'ob-repeatable-set-container-layout__'
    switch (element.layout) {
      case 'MULTIPLE_ADD_BUTTONS':
        return prefix + 'multiple-add-buttons'
      default:
        return 'single-add-button'
    }
  }, [element.layout])

  return (
    <div
      className={clsx('cypress-repeatable-set-element', validationClassName)}
      aria-labelledby={`${id}-label`}
      aria-describedby={ariaDescribedby}
      role="region"
    >
      {/*  */}
      <FormElementLabelContainer
        className={clsx(
          'ob-repeatable-set',
          isEven ? 'even' : 'odd',
          repeatableSetContainerClass,
        )}
        element={element}
        id={id}
        required={!!minSetEntries && minSetEntries > 0}
      >
        {element.layout === 'MULTIPLE_ADD_BUTTONS' && showAddButton && (
          <AddButton
            onAdd={() => handleAddEntry(0)}
            element={element}
            id={id}
            classes={['ob-button-repeatable-set-layout__multiple-add-buttons']}
          />
        )}
        {entries.map((entry, index) => {
          return (
            <RepeatableSetEntry
              key={entry[ENTRY_ID_PROPERTY_NAME] as string}
              formId={formId}
              index={index}
              id={id}
              isEven={isEven}
              entry={entry}
              element={element}
              showAddButton={
                element.layout === 'MULTIPLE_ADD_BUTTONS' && showAddButton
              }
              onChange={handleNestedChange}
              onLookup={onLookup}
              onAdd={handleAddEntry}
              onRemove={handleRemoveEntry}
              formElementsConditionallyShown={
                repeatableSetEntriesConditionallyShown[index.toString()]
              }
              formElementsValidation={
                repeatableSetValidation &&
                repeatableSetValidation.entries[index.toString()]
              }
              displayValidationMessages={displayValidationMessage}
              onUpdateFormElements={onUpdateFormElements}
              sectionState={sectionState}
            />
          )
        })}
        {(!element.layout || element.layout === 'SINGLE_ADD_BUTTON') &&
          showAddButton && (
            <AddButton
              onAdd={() => handleAddEntry(entries.length)}
              element={element}
              id={id}
            />
          )}
        {(isDirty || displayValidationMessage) &&
          !!repeatableSetValidation &&
          !!repeatableSetValidation.set && (
            <FormElementValidationMessage
              message={repeatableSetValidation.set}
            />
          )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementRepeatableSet)

type RepeatableSetEntryProps = {
  formId: number
  id: string
  index: number
  isEven: boolean
  entry: SubmissionTypes.S3SubmissionData['submission']
  element: FormTypes.RepeatableSetElement
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  showAddButton: boolean
  onChange: (
    index: number,
    formElement: FormTypes.FormElement,
    {
      value,
      executedLookups,
    }: Parameters<NestedFormElementValueChangeHandler>[1],
    idPrefix?: string,
  ) => void
  onLookup: FormElementLookupHandler
  onAdd: (index: number) => unknown
  onRemove: (
    index: number,
    element: FormTypes.RepeatableSetElement,
    idPrefix?: string,
  ) => unknown
  onUpdateFormElements: UpdateFormElementsHandler
  sectionState: SectionState
}

const RepeatableSetEntry = React.memo<RepeatableSetEntryProps>(
  function RepeatableSetEntry({
    formId,
    id,
    index,
    isEven,
    entry,
    element,
    formElementsConditionallyShown,
    displayValidationMessages,
    formElementsValidation,
    onChange,
    onLookup,
    onAdd,
    onRemove,
    onUpdateFormElements,
    showAddButton,
    sectionState,
  }: RepeatableSetEntryProps) {
    const [isConfirmingRemove, confirmRemove, cancelRemove] =
      useBooleanState(false)
    const elementDOMId = React.useMemo(() => new ElementDOMId(id), [id])

    const handleChange: NestedFormElementValueChangeHandler = React.useCallback(
      (nestedElement, { value, executedLookups, sectionState }, idPrefix) => {
        onChange(
          index,
          nestedElement,
          {
            value,
            executedLookups,
            sectionState,
          },
          idPrefix,
        )
      },
      [index, onChange],
    )

    const handleLookup = React.useCallback<FormElementLookupHandler>(
      (mergeLookupResults) => {
        onLookup((currentFormSubmission) => {
          let newEntry = {}
          const entries = currentFormSubmission.submission[
            element.name
          ] as Array<SubmissionTypes.S3SubmissionData['submission']>
          const repeatableSetExecutedLookups =
            (currentFormSubmission.executedLookups?.[
              element.name
            ] as ExecutedLookups[]) ?? Array.from(Array(entries.length))
          // if the repeatable set is prefilled or has minimum entries then executed lookups exists,
          // but is an empty array
          for (let i = 0; i < entries.length; i++) {
            if (!repeatableSetExecutedLookups[index]) {
              repeatableSetExecutedLookups[index] = {}
            }
          }
          let newExecutedLookups: ExecutedLookups = {}
          const elements = currentFormSubmission.elements.map((formElement) => {
            if (
              formElement.type === 'repeatableSet' &&
              formElement.name === element.name
            ) {
              const { elements, submission, executedLookups } =
                mergeLookupResults({
                  elements: formElement.elements,
                  submission: entries[index],
                  lastElementUpdated: currentFormSubmission.lastElementUpdated,
                  executedLookups: repeatableSetExecutedLookups[index] ?? {},
                  sectionState: currentFormSubmission.sectionState,
                })
              newEntry = submission
              newExecutedLookups = executedLookups as ExecutedLookups
              return {
                ...formElement,
                elements,
              }
            }
            return formElement
          })

          const submission = {
            ...currentFormSubmission.submission,
            [element.name]: entries.map((entry, i) => {
              if (i === index) {
                return newEntry
              }
              return entry
            }),
          }

          let updatedExecutedLookups = currentFormSubmission.executedLookups
          if (Array.isArray(repeatableSetExecutedLookups)) {
            updatedExecutedLookups = {
              ...currentFormSubmission.executedLookups,
              [element.name]: repeatableSetExecutedLookups.map((entry, i) => {
                if (i == index) {
                  return newExecutedLookups
                }
                return entry
              }),
            }
          }

          return {
            elements,
            submission,
            executedLookups: updatedExecutedLookups,
          }
        })
      },
      [element.name, index, onLookup],
    )

    const { validationClassName } = useValidationClass({
      formElementsValid: !formElementsValidation,
      displayInvalidClassName: displayValidationMessages,
      validClassName: 'ob-repeatable-set__valid',
      invalidClassName: 'ob-repeatable-set__invalid',
    })

    const handleUpdateNestedFormElements =
      React.useCallback<UpdateFormElementsHandler>(
        (setter) => {
          onUpdateFormElements((formElements) => {
            return formElements.map((formElement) => {
              if (
                formElement.id === element.id &&
                formElement.type === 'repeatableSet'
              ) {
                return {
                  ...formElement,
                  elements: setter(formElement.elements),
                }
              }
              return formElement
            })
          })
        },
        [element.id, onUpdateFormElements],
      )

    const idPrefix = elementDOMId.repeatableSetEntryDOMIdPrefix(
      index.toString(),
    )

    return (
      <RepeatableSetEntryProvider
        index={index}
        element={element}
        idPrefix={idPrefix}
        onRemove={onRemove}
        isAnimated={element.layout === 'MULTIPLE_ADD_BUTTONS'}
      >
        {({ onRemove }) => (
          <>
            <Modal
              isOpen={isConfirmingRemove}
              className="cypress-repeatable-set-prompt"
              titleClassName="cypress-repeatable-set-remove-entry-header"
              title={element.removeSetEntryLabel || 'Remove Entry'}
              actions={
                <>
                  <button
                    type="button"
                    className="button ob-button is-light cypress-cancel-repeatable-set"
                    onClick={cancelRemove}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="button ob-button is-primary cypress-confirm-repeatable-set"
                    onClick={() => {
                      cancelRemove()
                      onRemove()
                    }}
                    autoFocus
                  >
                    Yes
                  </button>
                </>
              }
            >
              Are you sure you want to remove this entry?
            </Modal>

            <div
              className={clsx(
                'ob-repeatable-set__container cypress-repeatable-set-container',
                validationClassName,
              )}
            >
              {(!element.layout || element.layout === 'SINGLE_ADD_BUTTON') && (
                <RemoveButton
                  onConfirmRemove={confirmRemove}
                  element={element}
                  className="ob-repeatable-set__button-remove-top"
                  index={index}
                />
              )}

              <OneBlinkFormElements
                formId={formId}
                idPrefix={idPrefix}
                isEven={isEven}
                formElementsValidation={formElementsValidation}
                displayValidationMessages={displayValidationMessages}
                elements={element.elements}
                onChange={handleChange}
                onLookup={handleLookup}
                model={entry}
                parentElement={element}
                formElementsConditionallyShown={formElementsConditionallyShown}
                onUpdateFormElements={handleUpdateNestedFormElements}
                sectionState={sectionState}
              />
              {element.layout === 'MULTIPLE_ADD_BUTTONS' && (
                <RemoveButton
                  onConfirmRemove={confirmRemove}
                  element={element}
                  index={index}
                  className="ob-repeatable-set__button-remove-bottom"
                />
              )}
            </div>
            {showAddButton && (
              <AddButton
                onAdd={() => onAdd(index + 1)}
                element={element}
                classes={[
                  'ob-button-repeatable-set-layout__multiple-add-buttons',
                ]}
              />
            )}
          </>
        )}
      </RepeatableSetEntryProvider>
    )
  },
)

function AddButton({
  id,
  onAdd,
  element,
  classes,
}: {
  id?: string
  onAdd: () => void
  element: FormTypes.RepeatableSetElement
  isPrimary?: boolean
  classes?: string[]
}) {
  return (
    <button
      type="button"
      className={clsx(
        'button ob-button ob-button__add cypress-add-repeatable-set is-primary',
        classes,
      )}
      onClick={onAdd}
      disabled={element.readOnly}
      aria-label={element.addSetEntryLabel ? undefined : 'Add Entry'}
      id={id}
    >
      <span className="icon">
        <MaterialIcon>add</MaterialIcon>
      </span>
      {!!element.addSetEntryLabel && <span>{element.addSetEntryLabel}</span>}
    </button>
  )
}

function RemoveButton({
  onConfirmRemove,
  element,
  className,
  index,
}: {
  onConfirmRemove: () => void
  element: FormTypes.RepeatableSetElement
  className?: string
  index: number
}) {
  return (
    <button
      type="button"
      className={clsx(
        'button ob-button ob-button_remove is-light cypress-remove-repeatable-set-entry',
        className,
      )}
      onClick={onConfirmRemove}
      disabled={element.readOnly}
      aria-label={`${element.removeSetEntryLabel ?? 'Remove Entry'} ${index + 1}`}
    >
      <span className="icon">
        <MaterialIcon>delete_outline</MaterialIcon>
      </span>
      {!!element.removeSetEntryLabel && (
        <span>{element.removeSetEntryLabel}</span>
      )}
    </button>
  )
}
