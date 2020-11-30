import * as React from 'react'
import useBooleanState from '../hooks/useBooleanState'
import generateDefaultData from '../services/generate-default-data'
import OneBlinkFormElements from '../components/OneBlinkFormElements'
import Modal from '../components/Modal'
import { FormTypes } from '@oneblink/types'

type Props = {
  id: string
  isEven: boolean
  element: FormTypes.RepeatableSetElement
  value: Array<FormElementsCtrl['model']> | undefined
  onChange: (formElement: FormTypes.FormElement, newValue: unknown[]) => unknown
  onChangeElements: (formElements: FormTypes.FormElement[]) => unknown
  onChangeModel: (model: FormElementsCtrl['model']) => unknown
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  parentFormElementsCtrl: FormElementsCtrl
  parentFormName?: string
}

function FormElementRepeatableSet({
  element,
  value,
  formElementValidation,
  id,
  isEven,
  displayValidationMessage,
  formElementConditionallyShown,
  parentFormElementsCtrl,
  parentFormName,
  onChange,
  onChangeElements,
  onChangeModel,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)

  const entries = React.useMemo(() => (Array.isArray(value) ? value : []), [
    value,
  ])

  const handleAddEntry = React.useCallback(() => {
    const newEntries = [...entries]
    const entry = generateDefaultData(element.elements, {})
    newEntries.push(entry)
    onChange(element, newEntries)
    setIsDirty()
  }, [element, entries, onChange, setIsDirty])

  const handleRemoveEntry = React.useCallback(
    (index) => {
      const newEntries = [...entries]
      console.log(newEntries[index])
      newEntries.splice(index, 1)
      onChange(element, newEntries)
      setIsDirty()
    },
    [element, entries, onChange, setIsDirty],
  )

  const handleNestedChange = React.useCallback(
    (index, nestedElement, value) => {
      if (nestedElement.type === 'page') {
        return
      }
      const newEntries = entries.map((entry, i) => {
        if (i === index) {
          return {
            ...entry,
            [nestedElement.name]: value,
          }
        } else {
          return entry
        }
      })
      onChange(element, newEntries)
    },
    [element, entries, onChange],
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
      <div
        className={`ob-form__element ob-repeatable-set ${
          isEven ? 'even' : 'odd'
        }`}
      >
        <label className="label ob-label">{element.label}</label>

        {entries.map((entry, index) => {
          return (
            <RepeatableSetEntry
              key={index}
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
              parentFormName={parentFormName}
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
            <div role="alert">
              <div className="has-text-danger ob-error__text cypress-validation-message">
                {repeatableSetValidation.set}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

export default React.memo(FormElementRepeatableSet)

type RepeatableSetEntryProps = {
  id: string
  index: number
  isEven: boolean
  entry: FormElementsCtrl['model']
  element: FormTypes.RepeatableSetElement
  parentFormElementsCtrl: FormElementsCtrl | undefined
  parentFormName?: string
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
    id,
    index,
    isEven,
    entry,
    element,
    formElementsConditionallyShown,
    displayValidationMessages,
    formElementsValidation,
    parentFormElementsCtrl,
    parentFormName,
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
            idPrefix={`${id}_entry-${index}`}
            isEven={isEven}
            formElementsValidation={formElementsValidation}
            displayValidationMessages={displayValidationMessages}
            elements={element.elements}
            onChange={handleChange}
            onChangeElements={handleChangeElements}
            onChangeModel={handleChangeModel}
            formElementsCtrl={formElementsCtrl}
            formElementsConditionallyShown={formElementsConditionallyShown}
            parentFormName={parentFormName}
          />
        </div>
      </>
    )
  },
)
