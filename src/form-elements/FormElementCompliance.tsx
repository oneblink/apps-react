import * as React from 'react'
import clsx from 'clsx'

import FormElementOptions from '../components/renderer/FormElementOptions'
import useFormElementOptions from '../hooks/useFormElementOptions'
import useToggleComplianceChildren from '../hooks/useToggleComplianceChildren'
import { FormTypes } from '@oneblink/types'
import OptionButton from './OptionButton'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import ComplianceButton from './ComplianceButton'
import FormElementFiles from './FormElementFiles'
import FormElementTextarea from './FormElementTextarea'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  IsDirtyProps,
  UpdateFormElementsHandler,
} from '../types/form'
import { attachmentsService } from '@oneblink/apps'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

interface Props extends IsDirtyProps {
  id: string
  element: FormTypes.ComplianceElement
  value: unknown
  onChange: FormElementValueChangeHandler<Value>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
  isEven?: boolean
  onUpdateFormElements: UpdateFormElementsHandler
}

export interface Value {
  value?: string
  notes?: string
  files?: attachmentsService.Attachment[]
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
  conditionallyShownOptionsElement,
  validationMessage,
  displayValidationMessage,
  isEven,
  onUpdateFormElements,
  isDirty,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const typedValue = value as Value | undefined

  const notesElement = React.useMemo<FormTypes.TextareaElement>(
    () => ({
      ...baseElement,
      readOnly: element.readOnly,
      id: `${element.id}-notes`,
      label: 'Notes',
      name: `${element.name}_notes`,
      type: 'textarea',
      autocompleteAttributes: element.autocompleteAttributes,
    }),
    [
      element.autocompleteAttributes,
      element.id,
      element.name,
      element.readOnly,
    ],
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
    (fe, { value: v }) => {
      onChange(fe, {
        value: (existingValue: Value | undefined) => {
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
        },
      })
    },
    [onChange],
  )
  const handleNotesChange = React.useCallback<
    React.ComponentProps<typeof FormElementTextarea>['onChange']
  >(
    (fe, { value: v }) => {
      onChange(element, {
        value: (existingValue) => {
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
        },
      })
    },
    [element, onChange],
  )
  const handleFilesChange = React.useCallback<
    React.ComponentProps<typeof FormElementFiles>['onChange']
  >(
    (fe, { value: v }) => {
      onChange(element, {
        value: (existingValue) => {
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
        },
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

  const filteredOptions = useFormElementOptions({
    element,
    value: typedValue?.value,
    onChange: handleValueChange,
    conditionallyShownOptionsElement,
    onUpdateFormElements,
  })

  return (
    <div
      className="cypress-compliance-element"
      aria-labelledby={`${id}-label`}
      aria-describedby={ariaDescribedby}
      role="region"
    >
      <FormElementLabelContainer
        className={`ob-compliance ${!isEven ? 'even' : 'odd'}`}
        id={id}
        element={element}
        required={element.required}
      >
        <div className="ob-compliance__container">
          <FormElementOptions
            options={element.options}
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
          >
            <div
              className="buttons ob-buttons ob-buttons-radio cypress-radio-button-group"
              role="group"
              aria-labelledby={`${id}-label`}
              aria-describedby={ariaDescribedby}
            >
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
                        handleValueChange(element, {
                          value: option.value,
                        })
                      }}
                      className={clsx(
                        'button ob-button ob-button__input ob-radio__button cypress-radio-button-control',
                        {
                          'is-primary': isSelected,
                          'is-light': !isSelected,
                        },
                      )}
                      aria-describedby={ariaDescribedby}
                    />
                  </div>
                )
              })}
            </div>
          </FormElementOptions>
          {(isDirty || displayValidationMessage) && !!validationMessage && (
            <FormElementValidationMessage message={validationMessage} />
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
                isDirty={isDirty}
                setIsDirty={setIsDirty}
                autocompleteAttributes={notesElement.autocompleteAttributes?.join(
                  ' ',
                )}
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
                isDirty={isDirty}
                setIsDirty={setIsDirty}
              />
            </div>
          )}
        </div>
      </FormElementLabelContainer>
    </div>
  )
}
export default React.memo(FormElementCompliance)
