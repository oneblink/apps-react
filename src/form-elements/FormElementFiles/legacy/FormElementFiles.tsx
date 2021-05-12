import * as React from 'react'

import useBooleanState from '../../../hooks/useBooleanState'
import useIsMounted from '../../../hooks/useIsMounted'
import FileCard from '../../../components/attachments/FileCard'
import { downloadFileLegacy } from '../../../services/download-file'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../../../components/FormElementLabelContainer'
import {
  checkIfContentTypeIsImage,
  parseFilesAsAttachmentsLegacy,
} from '../../../services/attachments'

export type FilesElementFile = {
  data: string
  fileName: string
}

type Props = {
  id: string
  element: FormTypes.FilesElement
  value: FilesElementFile[] | undefined
  onChange: FormElementValueChangeHandler<FilesElementFile[]>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

type ChildProps = {
  element: FormTypes.FilesElement
  onRemove: (index: number) => unknown
  file: FilesElementFile
  index: number
}

const FormElementFile = ({ element, onRemove, file, index }: ChildProps) => {
  const isImageType = React.useMemo(() => {
    const matches = file.data.match(/data:(\w*\/\w*);base64/)
    if (!matches) {
      return false
    }
    return checkIfContentTypeIsImage(matches[1])
  }, [file.data])
  const handleRemove = React.useCallback(
    () => onRemove(index),
    [index, onRemove],
  )
  const handleDownload = React.useCallback(async () => {
    await downloadFileLegacy(file.data, file.fileName)
  }, [file])

  return (
    <FileCard
      element={element}
      imageUrl={isImageType ? file.data : null}
      fileName={file.fileName}
      onDownload={handleDownload}
      onRemove={handleRemove}
    />
  )
}

const MemorisedFile = React.memo(FormElementFile)

function FormElementFiles({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDirty, setIsDirty] = useBooleanState(false)
  const isMounted = useIsMounted()

  const addFile = React.useCallback(
    async (newFiles) => {
      const attachments = await parseFilesAsAttachmentsLegacy(newFiles)
      if (!attachments.length) {
        return
      }

      const updatedValues = Array.isArray(value) ? [...value] : []
      updatedValues.push(...attachments)
      if (isMounted.current) {
        onChange(element, updatedValues)
        setIsDirty()
      }
    },
    [element, value, onChange, setIsDirty, isMounted],
  )

  const handleAdd = React.useCallback(() => {
    if (!inputRef.current) return
    inputRef.current.click()
  }, [])

  const handleRemove = React.useCallback(
    (index: number) => {
      const files = Array.isArray(value) ? [...value] : []
      const updatedValues = files.filter((file, i) => i !== index)

      if (isMounted.current) {
        if (inputRef.current) {
          // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
          inputRef.current.value = ''
        }
        onChange(element, updatedValues)
        setIsDirty()
      }
    },
    [value, isMounted, onChange, element, setIsDirty],
  )

  const files = Array.isArray(value) ? [...value] : []
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
            {files.map((file, index) => {
              return (
                <MemorisedFile
                  key={index}
                  element={element}
                  onRemove={handleRemove}
                  file={file}
                  index={index}
                />
              )
            })}
            {!element.readOnly &&
              (!element.maxEntries || files.length < element.maxEntries) && (
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
