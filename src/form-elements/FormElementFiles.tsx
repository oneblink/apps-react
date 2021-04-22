import * as React from 'react'
import clsx from 'clsx'

import useBooleanState from '../hooks/useBooleanState'
import useClickOutsideElement from '../hooks/useClickOutsideElement'
import useIsMounted from '../hooks/useIsMounted'
import downloadFile from '../services/download-file'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import parseFilesAsAttachments from '../services/parseFilesAsAttachments'

export type FilesElementFile = {
  data: string
  fileName: string
}

type Props = {
  id: string
  element: FormTypes.FilesElement
  value: unknown
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: FilesElementFile[] | undefined,
  ) => unknown
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
  const dropDownRef = React.useRef(null)
  const [isShowingMore, showMore, hideMore] = useBooleanState(false)
  const isImageType = React.useMemo(() => {
    const matches = file.data.match(/data:(\w*\/\w*);base64/)
    if (!matches) {
      return false
    }
    return matches[1].indexOf('image/') === 0
  }, [file])
  useClickOutsideElement(
    dropDownRef,
    React.useCallback(() => {
      if (isShowingMore) {
        hideMore()
      }
    }, [hideMore, isShowingMore]),
  )
  const handleRemove = React.useCallback((index) => onRemove(index), [onRemove])
  const handleDownload = React.useCallback(async () => {
    await downloadFile(file.data, file.fileName)
  }, [file])

  return (
    <div className="column is-one-quarter" key={index}>
      <div className="ob-files__box">
        <div className="ob-files__content">
          {isImageType ? (
            <div className="ob-files__content-image">
              <img className="ob-files__image" src={file.data} />
            </div>
          ) : (
            <div className="ob-files__content-file has-text-centered">
              <i className="material-icons icon-large ob-files__attach-icon has-text-grey">
                attach_file
              </i>
            </div>
          )}
        </div>
        <div
          className={clsx('dropdown is-right ob-files__menu', {
            'is-active': isShowingMore,
          })}
          ref={dropDownRef}
        >
          <div className="dropdown-trigger">
            <button
              type="button"
              className="button ob-files__menu-button cypress-file-menu-button"
              aria-haspopup="true"
              aria-controls="dropdown-menu"
              onClick={isShowingMore ? hideMore : showMore}
            >
              <i className="material-icons ob-files__menu-icon">more_vert</i>
            </button>
          </div>
          <div className="dropdown-menu" role="menu">
            <div className="dropdown-content">
              <a
                className="dropdown-item cypress-file-download-button"
                onClick={() => {
                  hideMore()
                  handleDownload()
                }}
              >
                Download
              </a>
              <a
                className={clsx('dropdown-item cypress-file-remove-button', {
                  'ob-files__menu-remove-hidden': element.readOnly,
                })}
                onClick={() => {
                  hideMore()
                  handleRemove(index)
                }}
              >
                Remove
              </a>
            </div>
          </div>
        </div>

        <div className="ob-files__file-name is-size-6">{file.fileName}</div>
      </div>
    </div>
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
      const attachments = await parseFilesAsAttachments(newFiles)
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
