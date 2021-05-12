import * as React from 'react'
import useBooleanState from '../../hooks/useBooleanState'
import useIsMounted from '../../hooks/useIsMounted'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../../components/FormElementLabelContainer'
import FormElementFile from './FormElementFile'
import useAttachments from '../../hooks/attachments/useAttachments'
import { checkFileNameIsValid } from '../../services/form-validation'
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
  const { addAttachments, removeAttachment, changeAttachment } = useAttachments(
    element,
    onChange,
  )

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
    // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
    inputRef.current.value = ''
    inputRef.current.click()
  }, [])

  const handleRemove = React.useCallback(
    (id: string) => {
      if (isMounted.current) {
        removeAttachment(id)
        setIsDirty()
      }
    },
    [removeAttachment, isMounted, setIsDirty],
  )
  const handleChange = React.useCallback(
    (id: string, attachment: Attachment) => {
      if (isMounted.current) {
        changeAttachment(id, attachment)
        setIsDirty()
      }
    },
    [changeAttachment, isMounted, setIsDirty],
  )

  const attachments = (value || []) as Attachment[]

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
                  onChange={handleChange}
                  disableUpload={
                    (!!element.maxEntries &&
                      attachments.length > element.maxEntries) ||
                    !checkFileNameIsValid(element, attachment.fileName)
                  }
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
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementFiles)
