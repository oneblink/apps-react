import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../hooks/useBooleanState'
import generateDefaultData from '../services/generate-default-data'
import OneBlinkFormElements from '../components/renderer/OneBlinkFormElements'
import Modal from '../components/renderer/Modal'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useValidationClass from '../hooks/useValidationClass'
import {
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValidation,
  FormElementValueChangeHandler,
  IsDirtyProps,
  UpdateFormElementsHandler,
} from '../types/form'
import useFormElementRepeatableSetEntries from '../hooks/useFormElementRepeatableSetEntries'

type Props = {
  formId: number
  id: string
  isEven: boolean
  element: FormTypes.RepeatableSetElement
  value: Array<SubmissionTypes.S3SubmissionData['submission']> | undefined
  onChange: FormElementValueChangeHandler<
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

  const handleAddEntry = React.useCallback(() => {
    onChange(element, (existingEntries) => {
      const newEntries = [...(existingEntries || [])]
      const entry = generateDefaultData(element.elements, {})
      newEntries.push(entry)
      return newEntries
    })
    setIsDirty()
  }, [element, onChange, setIsDirty])

  const handleRemoveEntry = React.useCallback(
    (index: number) => {
      onChange(element, (existingEntries) => {
        const newEntries = [...(existingEntries || [])]
        newEntries.splice(index, 1)
        return newEntries
      })
      setIsDirty()
    },
    [element, onChange, setIsDirty],
  )

  const handleNestedChange = React.useCallback(
    (index: number, nestedElement: FormTypes.FormElement, value: unknown) => {
      if (!('name' in nestedElement)) {
        return
      }
      onChange(element, (existingEntries) => {
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

  return (
    <div
      className={clsx('cypress-repeatable-set-element', validationClassName)}
    >
      <FormElementLabelContainer
        className={`ob-repeatable-set ${isEven ? 'even' : 'odd'}`}
        element={element}
        id={id}
        required={!!minSetEntries && minSetEntries > 0}
      >
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
              onChange={handleNestedChange}
              onLookup={onLookup}
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
        {(!maxSetEntries || entries.length < maxSetEntries) && (
          <button
            type="button"
            className="button ob-button ob-button__add is-primary cypress-add-repeatable-set"
            onClick={handleAddEntry}
            disabled={element.readOnly}
          >
            <span className="icon">
              <i className="material-icons">add</i>
            </span>
            {!!element.addSetEntryLabel && (
              <span>{element.addSetEntryLabel}</span>
            )}
          </button>
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
  onChange: (
    index: number,
    formElement: FormTypes.FormElement,
    value: unknown,
  ) => unknown
  onLookup: FormElementLookupHandler
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
    onRemove,
    onUpdateFormElements,
  }: RepeatableSetEntryProps) {
    const [isConfirmingRemove, confirmRemove, cancelRemove] =
      useBooleanState(false)

    const handleChange = React.useCallback(
      (element: FormTypes.FormElement, value: unknown) => {
        onChange(index, element, value)
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
          const elements = currentFormSubmission.elements.map((formElement) => {
            if (
              formElement.type === 'repeatableSet' &&
              formElement.name === element.name
            ) {
              const { elements, submission } = mergeLookupResults({
                elements: formElement.elements,
                submission: entries[index],
                lastElementUpdated: currentFormSubmission.lastElementUpdated,
              })
              newEntry = submission
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

          return {
            elements,
            submission,
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
          <button
            type="button"
            className="button ob-button ob-button_remove is-light cypress-remove-repeatable-set-entry"
            onClick={confirmRemove}
            disabled={element.readOnly}
          >
            <span className="icon">
              <i className="material-icons">delete_outline</i>
            </span>
            {!!element.removeSetEntryLabel && (
              <span>{element.removeSetEntryLabel}</span>
            )}
          </button>

          <OneBlinkFormElements
            formId={formId}
            idPrefix={`${id}_entry-${index}_`}
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
        </div>
      </RepeatableSetIndexContext.Provider>
    )
  },
)
