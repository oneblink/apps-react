import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import FormElementFile from './FormElementFile'
import useAttachments from '../hooks/attachments/useAttachments'
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from '../services/form-validation'
import { attachmentsService } from '@oneblink/apps'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'

export function stringifyAttachments(
  value: attachmentsService.Attachment[] | undefined,
): string {
  if (value?.every((attachment) => !attachment.type)) {
    return JSON.stringify(value)
  }
  return ''
}

function FormElementFiles({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: {
  id: string
  element: FormTypes.FilesElement
  value?: attachmentsService.Attachment[]
  onChange: FormElementValueChangeHandler<attachmentsService.Attachment[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps) {
  const { addAttachments, removeAttachment, changeAttachment } = useAttachments(
    element,
    onChange,
    setIsDirty,
  )

  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleAdd = React.useCallback(() => {
    if (!inputRef.current) return
    // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
    inputRef.current.value = ''
    inputRef.current.click()
  }, [])

  const attachments = value || []

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

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
          onChange={(event) =>
            addAttachments(
              event.target.files ? Array.from(event.target.files) : [],
            )
          }
        />
        <div className="control cypress-files-control">
          <div className="columns is-multiline">
            {attachments.map((attachment, index) => {
              return (
                <FormElementFile
                  key={attachment.type ? attachment._id : attachment.id}
                  element={element}
                  onRemove={removeAttachment}
                  file={attachment}
                  onChange={changeAttachment}
                  disableUpload={
                    (!!element.maxEntries &&
                      attachments.length > element.maxEntries) ||
                    !checkFileNameIsValid(element, attachment.fileName) ||
                    !checkFileNameExtensionIsValid(element, attachment.fileName)
                  }
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

        {isDisplayingValidationMessage && (
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
