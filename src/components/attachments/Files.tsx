import * as React from 'react'

import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../FormElementLabelContainer'

function Files<T>({
  id,
  element,
  isDirty,
  attachments,
  validationMessage,
  displayValidationMessage,
  onAddFiles,
  onRenderAttachment,
}: {
  id: string
  element: FormTypes.FilesElement
  isDirty: boolean
  attachments: T[]
  displayValidationMessage: boolean
  validationMessage: string | undefined
  onAddFiles: (files: File[]) => void
  onRenderAttachment: (attachment: T, index: number) => React.ReactNode
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleAdd = React.useCallback(() => {
    if (!inputRef.current) return
    // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
    inputRef.current.value = ''
    inputRef.current.click()
  }, [])

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
            onAddFiles(event.target.files ? Array.from(event.target.files) : [])
          }
        />
        <div className="control cypress-files-control">
          <div className="columns is-multiline">
            {attachments.map(onRenderAttachment)}
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

export default React.memo(Files)
