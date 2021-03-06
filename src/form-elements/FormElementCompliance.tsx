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
import FormElementFiles, { PossibleFileConfiguration } from './FormElementFiles'
import FormElementTextarea from './FormElementTextarea'
import { FormElementValueChangeHandler } from '../types/form'

interface Props {
  id: string
  element: FormTypes.ComplianceElement
  value: unknown
  onChange: FormElementValueChangeHandler<Value>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  conditionallyShownOptions: FormTypes.ChoiceElementOption[] | undefined
  isEven?: boolean
}

export interface Value {
  value?: string
  notes?: string
  files?: PossibleFileConfiguration[]
}

const baseElement = {
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
  required: false,
  requiresAllConditionallyShowPredicates: false,
}

function FormElementCompliance({
  id,
  element,
  value,
  onChange,
  conditionallyShownOptions,
  validationMessage,
  displayValidationMessage,
  isEven,
}: Props) {
  const typedValue = value as Value | undefined

  const notesElement = React.useMemo<FormTypes.TextareaElement>(
    () => ({
      ...baseElement,
      readOnly: element.readOnly,
      id: `${element.id}-notes`,
      label: 'Notes',
      name: `${element.name}_notes`,
      type: 'textarea',
    }),
    [element.id, element.name, element.readOnly],
  )
  const filesElement = React.useMemo<FormTypes.FilesElement>(
    () => ({
      ...baseElement,
      readOnly: element.readOnly,
      id: `${element.id}-files`,
      label: 'Media',
      name: `${element.name}_files`,
      type: 'files',
      maxEntries: undefined,
      minEntries: undefined,
      restrictFileTypes: false,
      storageType: element.storageType,
    }),
    [element.id, element.name, element.readOnly, element.storageType],
  )

  const handleValueChange = React.useCallback<
    FormElementValueChangeHandler<string>
  >(
    (fe, v) => {
      onChange(fe, (existingValue: Value | undefined) => {
        let newValue = undefined
        if (typeof v === 'function') {
          newValue = v(existingValue ? existingValue.value : undefined)
        } else {
          newValue = v
        }
        if (!newValue) {
          return
        }
        return {
          ...existingValue,
          value: newValue,
        }
      })
    },
    [onChange],
  )
  const handleNotesChange = React.useCallback<
    React.ComponentProps<typeof FormElementTextarea>['onChange']
  >(
    (fe, v) => {
      onChange(element, (existingValue) => {
        if (!existingValue) {
          return
        }
        let newNotes = undefined
        if (typeof v === 'function') {
          newNotes = v(existingValue.notes)
        } else {
          newNotes = v
        }
        return {
          ...existingValue,
          notes: newNotes,
        }
      })
    },
    [element, onChange],
  )
  const handleFilesChange = React.useCallback<
    React.ComponentProps<typeof FormElementFiles>['onChange']
  >(
    (fe, v) => {
      onChange(element, (existingValue) => {
        if (!existingValue) {
          return
        }
        let newFiles = undefined
        if (typeof v === 'function') {
          newFiles = v(existingValue.files)
        } else {
          newFiles = v
        }
        return {
          ...existingValue,
          files: newFiles && newFiles.length ? newFiles : undefined,
        }
      })
    },
    [element, onChange],
  )

  const [isShowingNotes, toggleIsShowingNotes] = useToggleComplianceChildren(
    element,
    !!typedValue?.notes,
    handleNotesChange,
  )
  const [isShowingFiles, toggleIsShowingFiles] = useToggleComplianceChildren(
    element,
    !!typedValue?.files,
    handleFilesChange,
  )

  const [isDirty, setIsDirty] = useBooleanState(false)

  const filteredOptions = useFormElementOptions({
    element,
    value: typedValue?.value,
    onChange: handleValueChange,
    conditionallyShownOptions,
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
                const isSelected = typedValue?.value === option.value
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
              disabled={element.readOnly || !typedValue?.value}
            >
              Notes
            </ComplianceButton>
            <ComplianceButton
              isActive={isShowingFiles}
              icon="perm_media"
              onClick={toggleIsShowingFiles}
              disabled={element.readOnly || !typedValue?.value}
            >
              Media
            </ComplianceButton>
          </div>
          {isShowingNotes && (
            <div className="ob-compliance-child-element">
              <FormElementTextarea
                id={`${id}-notes`}
                onChange={handleNotesChange}
                displayValidationMessage={false}
                validationMessage={undefined}
                value={typedValue?.notes}
                element={notesElement}
              />
            </div>
          )}
          {isShowingFiles && (
            <div className="ob-compliance-child-element">
              <FormElementFiles
                id={`${id}-files`}
                onChange={handleFilesChange}
                displayValidationMessage={false}
                validationMessage={undefined}
                value={typedValue?.files}
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
