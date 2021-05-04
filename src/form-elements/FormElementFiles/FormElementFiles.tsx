import * as React from 'react'
import useBooleanState from '../../hooks/useBooleanState'
import useIsMounted from '../../hooks/useIsMounted'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../../components/FormElementLabelContainer'
import FormElementFile from './FormElementFile'
import useAttachments from '../../hooks/attachments/useAttachments'
import FormElementFilesInvalidAttachment from './FormElementFilesInvalidAttachment'
import { Attachment } from '../../types/attachments'
type Props = {
  id: string
  element: FormTypes.FilesElement
  value?: Attachment[]
  onChange: FormElementValueChangeHandler<Attachment[]>
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
  const [
    { allAttachments, validAttachments, errorAttachments },
    {
      addAttachments,
      removeAttachment,
      changeAttachment,
      clearInvalidAttachments,
    },
  ] = useAttachments(Array.isArray(value) ? value : [], element, onChange)

  const [isDirty, setIsDirty] = useBooleanState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const isMounted = useIsMounted()

  const addFile = React.useCallback(
    async (newFilesList: FileList | null) => {
      if (!newFilesList) return
      const newFiles = Array.from(newFilesList)
      if (!newFiles.length) return
      if (isMounted.current) {
        addAttachments(newFiles)
        setIsDirty()
      }
    },
    [addAttachments, isMounted, setIsDirty],
  )
  const handleAdd = React.useCallback(() => {
    if (!inputRef.current) return
    inputRef.current.click()
  }, [])

  const handleRemove = React.useCallback(
    (id: string) => {
      if (isMounted.current) {
        if (inputRef.current) {
          // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
          inputRef.current.value = ''
        }
        removeAttachment(id)
        setIsDirty()
      }
    },
    [removeAttachment, isMounted, setIsDirty],
  )
  const handleChange = React.useCallback(
    (id: string, attachment: Attachment) => {
      //const updatedValues = changeAttachment(id, attachment)
      if (isMounted.current) {
        changeAttachment(id, attachment)
        setIsDirty()
      }
    },
    [changeAttachment, isMounted, setIsDirty],
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
            {validAttachments.map((attachment, index) => {
              return (
                <FormElementFile
                  key={index}
                  element={element}
                  onRemove={handleRemove}
                  file={attachment}
                  onChange={handleChange}
                />
              )
            })}
            {!element.readOnly &&
              (!element.maxEntries ||
                allAttachments.length < element.maxEntries) && (
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
        {!!errorAttachments.length && (
          <div className="ob-files__upload-errors-container">
            {errorAttachments.map((errorAttachment, i) => {
              return (
                <FormElementFilesInvalidAttachment
                  key={i}
                  file={errorAttachment}
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
