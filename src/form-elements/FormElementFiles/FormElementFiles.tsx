import * as React from 'react'
import useBooleanState from '../../hooks/useBooleanState'
import useIsMounted from '../../hooks/useIsMounted'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../../components/FormElementLabelContainer'
import FormElementFile from './FormElementFile'
import useFormDefinition from '../../hooks/useFormDefinition'
import useAttachments, { FileConfiguration } from '../../hooks/useAttachments'
import FormElementFilesInvalidAttachment from './FormElementFilesInvalidAttachment'
type Props = {
  id: string
  element: FormTypes.FilesElement
  value?: Array<FileConfiguration>
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: FileConfiguration[],
  ) => unknown
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementFiles({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const form = useFormDefinition()
  const [
    { attachments, invalidAttachments },
    { addAttachments, removeAttachment, clearInvalidAttachments },
  ] = useAttachments(element, Array.isArray(value) ? value : [])
  const [isDirty, setIsDirty] = useBooleanState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMounted = useIsMounted()

  const addFile = React.useCallback(
    async (newFiles: FileList | null) => {
      if (!form || !newFiles) return
      // TODO: ROTATE ATTACHMENTS

      const newAttachments = await addAttachments(Array.from(newFiles))
      const updatedValues = Array.isArray(value) ? [...value] : []
      updatedValues.push(...newAttachments)
      if (isMounted.current) {
        onChange(element, updatedValues)
        setIsDirty()
      }
    },
    [form, addAttachments, value, isMounted, onChange, element, setIsDirty],
  )
  const handleAdd = React.useCallback(() => {
    if (!inputRef.current) return
    inputRef.current.click()
  }, [])

  const handleRemove = React.useCallback(
    (index: number) => {
      const updatedValues = removeAttachment(index)
      if (isMounted.current) {
        if (inputRef.current) {
          // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
          inputRef.current.value = ''
        }
        onChange(element, updatedValues)
        setIsDirty()
      }
    },
    [removeAttachment, isMounted, onChange, element, setIsDirty],
  )

  return (
    <div className="cypress-files-element">
      <FormElementLabelContainer
        className="ob-files"
        element={element}
        id={id}
        required={!!element.minEntries}
      >
        <input
          ref={inputRef}
          type="file"
          name={element.name}
          id={id}
          className="file-input ob-input"
          multiple={element.maxEntries !== 1}
          disabled={element.readOnly}
          onChange={(e) => addFile(e.target.files)}
        />
        <div className="control cypress-files-control">
          <div className="columns is-multiline">
            {attachments.map((attachment, index) => {
              return (
                <FormElementFile
                  key={index}
                  element={element}
                  onRemove={handleRemove}
                  file={attachment}
                  index={index}
                />
              )
            })}
            {!element.readOnly &&
              (!element.maxEntries ||
                attachments.length < element.maxEntries) && (
                <div className="column is-one-quarter">
                  <button
                    type="button"
                    className="button ob-files__add-new-button"
                    onClick={handleAdd}
                  >
                    <i className="material-icons icon-x-large">add</i>
                  </button>
                </div>
              )}
          </div>
        </div>

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
        {!!invalidAttachments.length && (
          <div className="ob-files__upload-errors-container">
            {invalidAttachments.map((invalidAttachments, i) => {
              return (
                <FormElementFilesInvalidAttachment
                  key={i}
                  file={invalidAttachments}
                />
              )
            })}
            <div className="buttons ob-buttons ob-files__upload-errors-clear-button-container">
              <button
                type="button"
                className="button ob-button is-light cypress-clear-invalid-attachments"
                onClick={clearInvalidAttachments}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementFiles)
