import * as React from 'react'
import clsx from 'clsx'

import FormElementOptions from '../components/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useBooleanState from '../hooks/useBooleanState'
import useToggleComplianceChildren from '../hooks/useToggleComplianceChildren'
import { FormTypes } from '@oneblink/types'
import OptionButton from './OptionButton'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import ComplianceButton from './ComplianceButton'
import FormElementFiles, { FilesElementFile } from './FormElementFiles'
import FormElementTextarea from './FormElementTextarea'

interface Props {
  id: string
  element: FormTypes.ComplianceElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: Value | undefined,
  ) => unknown
  onConditionallyShowOption: (
    choiceElementOption: FormTypes.ChoiceElementOption,
  ) => boolean
  displayValidationMessage: boolean
  validationMessage: string | undefined
  isEven?: boolean
}

export interface Value {
  value: unknown
  notes?: string
  files?: FilesElementFile[]
}

const baseElement = {
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
  readOnly: false,
  required: true,
  requiresAllConditionallyShowPredicates: false,
}

const generateNotesElement = (
  element: FormTypes.ComplianceElement,
): FormTypes.TextareaElement => ({
  ...baseElement,
  id: `${element.id}-notes`,
  label: 'Notes',
  name: `${element.name}_notes`,
  type: 'textarea',
})
const generateFilesElement = (
  element: FormTypes.ComplianceElement,
): FormTypes.FilesElement => ({
  ...baseElement,
  id: `${element.id}-files`,
  label: 'Media',
  name: `${element.name}_files`,
  type: 'files',
  maxEntries: undefined,
  minEntries: undefined,
  restrictFileTypes: false,
})
function FormElementCompliance({
  id,
  element,
  value,
  onChange,
  onConditionallyShowOption,
  validationMessage,
  displayValidationMessage,
  isEven,
}: Props) {
  const typedValue: Value = React.useMemo(() => {
    if (typeof value === 'object' && !!value) {
      return value as Value
    } else {
      return {
        value: undefined,
      }
    }
  }, [value])

  const notesElement = React.useMemo(() => generateNotesElement(element), [
    element,
  ])
  const filesElement = React.useMemo(() => generateFilesElement(element), [
    element,
  ])

  const handleValueChange = React.useCallback(
    (fe: FormTypes.FormElement, v: unknown) => {
      onChange(fe, {
        ...typedValue,
        value: v,
      })
    },
    [onChange, typedValue],
  )
  const handleNotesChange = React.useCallback(
    (v: unknown) => {
      const newNotes = !!v && typeof v === 'string' ? v : undefined
      onChange(element, { ...typedValue, notes: newNotes })
    },
    [element, onChange, typedValue],
  )
  const handleFilesChange = React.useCallback(
    (v: FilesElementFile[] | undefined) => {
      const newFiles = v ? v : undefined
      onChange(element, { ...typedValue, files: newFiles })
    },
    [element, onChange, typedValue],
  )

  const [isShowingNotes, toggleIsShowingNotes] = useToggleComplianceChildren(
    handleNotesChange,
  )
  const [isShowingFiles, toggleIsShowingFiles] = useToggleComplianceChildren(
    handleFilesChange,
  )

  const [isDirty, setIsDirty] = useBooleanState(false)

  const filteredOptions = useFormElementOptions({
    element,
    value: typedValue.value,
    onChange: handleValueChange,
    onFilter: onConditionallyShowOption,
  })

  return (
    <div className="cypress-compliance-element">
      <FormElementLabelContainer
        className={`ob-compliance ${!isEven ? 'even' : 'odd'}`}
        id={id}
        element={element}
        required={element.required}
      >
        <div className="ob-compliance__container">
          <FormElementOptions options={element.options}>
            <div className="buttons ob-buttons ob-buttons-radio cypress-radio-button-group">
              {filteredOptions.map((option) => {
                const isSelected = typedValue.value === option.value
                return (
                  <div className="ob-button-radio-container" key={option.value}>
                    <OptionButton
                      element={element}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => {
                        setIsDirty()
                        handleValueChange(element, option.value)
                      }}
                      className={clsx(
                        'button ob-button ob-button__input ob-radio__button cypress-radio-button-control',
                        {
                          'is-primary': isSelected,
                          'is-light': !isSelected,
                        },
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </FormElementOptions>
          {(isDirty || displayValidationMessage) && !!validationMessage && (
            <div role="alert" className="has-margin-top-8">
              <div className="has-text-danger ob-error__text cypress-validation-message">
                {validationMessage}
              </div>
            </div>
          )}
          <div className="buttons ob-buttons ob-buttons-compliance cypress-compliance-button-group">
            <ComplianceButton
              isActive={isShowingNotes}
              icon="notes"
              onClick={toggleIsShowingNotes}
              disabled={element.readOnly || !typedValue.value}
            >
              Notes
            </ComplianceButton>
            <ComplianceButton
              isActive={isShowingFiles}
              icon="perm_media"
              onClick={toggleIsShowingFiles}
              disabled={element.readOnly || !typedValue.value}
            >
              Media
            </ComplianceButton>
          </div>
          {isShowingNotes && (
            <div className="ob-compliance-child-element">
              <FormElementTextarea
                id={`${id}-notes`}
                onChange={(fe, v) => handleNotesChange(v)}
                displayValidationMessage={false}
                validationMessage={undefined}
                value={typedValue.notes}
                element={notesElement}
              />
            </div>
          )}
          {isShowingFiles && (
            <div className="ob-compliance-child-element">
              <FormElementFiles
                id={`${id}-files`}
                onChange={(fe, v) => handleFilesChange(v)}
                displayValidationMessage={false}
                validationMessage={undefined}
                value={typedValue.files}
                element={filesElement}
              />
            </div>
          )}
        </div>
      </FormElementLabelContainer>
    </div>
  )
}
export default React.memo(FormElementCompliance)
