import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
import generateDefaultData from '../services/generate-default-data'
import OneBlinkFormElements from '../components/OneBlinkFormElements'
import Modal from '../components/Modal'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'

type Props = {
  formId: number
  id: string
  isEven: boolean
  element: FormTypes.RepeatableSetElement
  value: Array<FormElementsCtrl['model']> | undefined
  onChange: FormElementValueChangeHandler<FormElementsCtrl['model'][]>
  onChangeElements: (formElements: FormTypes.FormElement[]) => unknown
  onChangeModel: (model: FormElementsCtrl['model']) => unknown
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  parentFormElementsCtrl: FormElementsCtrl
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
  parentFormElementsCtrl,
  onChange,
  onChangeElements,
  onChangeModel,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const entries = React.useMemo(() => (Array.isArray(value) ? value : []), [
    value,
  ])

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
    (index) => {
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
    (index, nestedElement, value) => {
      if (nestedElement.type === 'page') {
        return
      }
      onChange(element, (existingEntries) => {
        const newEntries = (existingEntries || []).map((entry, i) => {
          if (i === index) {
            return {
              ...entry,
              [nestedElement.name]: value,
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

  const handleChangeElements = React.useCallback(
    (index, elements) => {
      const newElements: FormTypes.FormElement[] = parentFormElementsCtrl.elements.map(
        (parentElement) => {
          if (parentElement.id === element.id) {
            return {
              ...parentElement,
              elements,
            }
          }
          return parentElement
        },
      )

      onChangeElements(newElements)
    },
    [element.id, onChangeElements, parentFormElementsCtrl.elements],
  )
  const handleChangeModel = React.useCallback(
    (index, model) => {
      onChangeModel({
        ...parentFormElementsCtrl.model,
        [element.name]: entries.map((entry, i) => {
          if (i === index) {
            return model
          } else {
            return entry
          }
        }),
      })
    },
    [element.name, entries, onChangeModel, parentFormElementsCtrl.model],
  )

  const repeatableSetValidation =
    !formElementValidation ||
    typeof formElementValidation === 'string' ||
    formElementValidation.type !== 'repeatableSet'
      ? undefined
      : formElementValidation

  const repeatableSetEntriesConditionallyShown =
    formElementConditionallyShown &&
    formElementConditionallyShown.type === 'repeatableSet'
      ? formElementConditionallyShown.entries
      : {}
  return (
    <div className="cypress-repeatable-set-element">
      <FormElementLabelContainer
        className={`ob-repeatable-set ${isEven ? 'even' : 'odd'}`}
        element={element}
        id={id}
        required={!!element.minSetEntries}
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
              onChangeElements={handleChangeElements}
              onChangeModel={handleChangeModel}
              onRemove={handleRemoveEntry}
              formElementsConditionallyShown={
                repeatableSetEntriesConditionallyShown[index.toString()]
              }
              formElementsValidation={
                repeatableSetValidation &&
                repeatableSetValidation.entries[index.toString()]
              }
              displayValidationMessages={displayValidationMessage}
              parentFormElementsCtrl={parentFormElementsCtrl}
            />
          )
        })}

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
  entry: FormElementsCtrl['model']
  element: FormTypes.RepeatableSetElement
  parentFormElementsCtrl: FormElementsCtrl | undefined
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  onChange: (
    index: number,
    formElement: FormTypes.FormElement,
    value: unknown,
  ) => unknown
  onChangeElements: (
    index: number,
    formElements: FormTypes.FormElement[],
  ) => unknown
  onChangeModel: (index: number, model: FormElementsCtrl['model']) => unknown
  onRemove: (index: number) => unknown
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
    parentFormElementsCtrl,
    onChange,
    onChangeElements,
    onChangeModel,
    onRemove,
  }: RepeatableSetEntryProps) {
    const [isConfirmingRemove, confirmRemove, cancelRemove] = useBooleanState(
      false,
    )

    const formElementsCtrl = React.useMemo<FormElementsCtrl>(() => {
      return {
        model: entry,
        elements: element.elements,
        parentFormElementsCtrl,
      }
    }, [element.elements, entry, parentFormElementsCtrl])

    const handleChange = React.useCallback(
      (element, value) => {
        onChange(index, element, value)
      },
      [index, onChange],
    )

    const handleChangeElements = React.useCallback(
      (elements) => {
        onChangeElements(index, elements)
      },
      [index, onChangeElements],
    )
    const handleChangeModel = React.useCallback(
      (model) => {
        onChangeModel(index, model)
      },
      [index, onChangeModel],
    )

    return (
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
          className="ob-repeatable-set__container cypress-repeatable-set-container"
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
            onChangeElements={handleChangeElements}
            onChangeModel={handleChangeModel}
            formElementsCtrl={formElementsCtrl}
            formElementsConditionallyShown={formElementsConditionallyShown}
          />
        </div>
      </>
    )
  },
)
