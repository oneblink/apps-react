import * as React from 'react'
import clsx from 'clsx'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useBooleanState from '../hooks/useBooleanState'
import generateDefaultData from '../services/generate-default-data'
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
} from '../types/form'
import useFormElementRepeatableSetEntries from '../hooks/useFormElementRepeatableSetEntries'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'
import ElementDOMId from '../utils/elementDOMIds'

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
} & IsDirtyProps

const RepeatableSetIndexContext = React.createContext<number>(0)

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
}: Props) {
  const entries = React.useMemo(
    () => (Array.isArray(value) ? value : []),
    [value],
  )

  const handleAddEntry = React.useCallback(
    (index: number | undefined) => {
      onChange(element, {
        value: (existingEntries) => {
          const newEntries = [...(existingEntries || [])]
          const entry = generateDefaultData(element.elements, {})

          newEntries.splice((index === undefined ? -1 : index) + 1, 0, entry)
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
      })
      setIsDirty()
    },
    [element, onChange, setIsDirty, entries],
  )

  const handleRemoveEntry = React.useCallback(
    (index: number) => {
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
      })
      setIsDirty()
    },
    [element, onChange, setIsDirty],
  )

  const handleNestedChange = React.useCallback(
    (
      index: number,
      nestedElement: FormTypes.FormElement,
      {
        value,
        executedLookups,
      }: Parameters<NestedFormElementValueChangeHandler>[1],
    ) => {
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
            onAdd={() => handleAddEntry(undefined)}
            element={element}
            classes={['ob-button-repeatable-set-layout__multiple-add-buttons']}
          />
        )}
        {entries.map((entry, index) => {
          return (
            <RepeatableSetEntry
              key={index}
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
            />
          )
        })}
        {(!element.layout || element.layout === 'SINGLE_ADD_BUTTON') &&
          showAddButton && (
            <AddButton
              onAdd={() => handleAddEntry(undefined)}
              element={element}
              classes={['is-primary']}
            />
          )}
        {(isDirty || displayValidationMessage) &&
          !!repeatableSetValidation &&
          !!repeatableSetValidation.set && (
            <div role="alert" className="has-margin-top-8">
              <div className="has-text-danger ob-error__text cypress-validation-message">
                {repeatableSetValidation.set}
              </div>
            </div>
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
  ) => void
  onLookup: FormElementLookupHandler
  onAdd: (index: number) => unknown
  onRemove: (index: number) => unknown
  onUpdateFormElements: UpdateFormElementsHandler
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
  }: RepeatableSetEntryProps) {
    const [isConfirmingRemove, confirmRemove, cancelRemove] =
      useBooleanState(false)

    const handleChange: NestedFormElementValueChangeHandler = React.useCallback(
      (nestedElement, { value, executedLookups }) => {
        onChange(index, nestedElement, {
          value,
          executedLookups,
        })
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

    const elementDOMId = React.useMemo(() => new ElementDOMId(id), [id])

    return (
      <RepeatableSetIndexContext.Provider value={index}>
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
                  onRemove(index)
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
          key={index}
          className={clsx(
            'ob-repeatable-set__container cypress-repeatable-set-container',
            validationClassName,
          )}
        >
          {(!element.layout || element.layout === 'SINGLE_ADD_BUTTON') && (
            <RemoveButton
              onConfirmRemove={confirmRemove}
              element={element}
              classes={['is-pulled-right']}
            />
          )}

          <OneBlinkFormElements
            formId={formId}
            idPrefix={elementDOMId.repeatableSetEntryDOMIdPrefix(
              index.toString(),
            )}
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
          />
          {element.layout === 'MULTIPLE_ADD_BUTTONS' && (
            <div className="is-flex">
              <RemoveButton onConfirmRemove={confirmRemove} element={element} />
            </div>
          )}
        </div>
        {showAddButton && (
          <AddButton
            onAdd={() => onAdd(index)}
            element={element}
            classes={['ob-button-repeatable-set-layout__multiple-add-buttons']}
          />
        )}
      </RepeatableSetIndexContext.Provider>
    )
  },
)

function AddButton({
  onAdd,
  element,
  classes,
}: {
  onAdd: () => void
  element: FormTypes.RepeatableSetElement
  isPrimary?: boolean
  classes: string[]
}) {
  return (
    <button
      type="button"
      className={clsx(
        'button ob-button ob-button__add cypress-add-repeatable-set',
        classes,
      )}
      onClick={onAdd}
      disabled={element.readOnly}
      aria-label={element.addSetEntryLabel ? undefined : 'Add Entry'}
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
  classes,
}: {
  onConfirmRemove: () => void
  element: FormTypes.RepeatableSetElement
  classes?: string[]
}) {
  return (
    <button
      type="button"
      className={clsx(
        'button ob-button_remove is-light cypress-remove-repeatable-set-entry',
        ...(classes ?? []),
      )}
      onClick={onConfirmRemove}
      disabled={element.readOnly}
      aria-label={element.removeSetEntryLabel ? undefined : 'Remove Entry'}
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
