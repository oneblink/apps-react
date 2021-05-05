import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../../hooks/useBooleanState'
import useClickOutsideElement from '../../hooks/useClickOutsideElement'
import downloadFile from '../../services/download-file'
import { FormTypes } from '@oneblink/types'
import useAttachment, { OnChange } from '../../hooks/attachments/useAttachment'
import FormElementFileDisplay from './FormElementFileDisplay'
import FormElementFileStatus from './FormElementFileStatus'
import { AttachmentValid } from '../../types/attachments'

type Props = {
  element: FormTypes.FilesElement
  onRemove: (id: string) => void
  file: AttachmentValid
  onChange: OnChange
}

const FormElementFile = ({ element, onRemove, file, onChange }: Props) => {
  const dropDownRef = React.useRef(null)
  const [isShowingMore, showMore, hideMore] = useBooleanState(false)
  useAttachment(file, element, onChange)

  useClickOutsideElement(
    dropDownRef,
    React.useCallback(() => {
      if (isShowingMore) {
        hideMore()
      }
    }, [hideMore, isShowingMore]),
  )

  const handleRemove = React.useCallback(() => {
    hideMore()
    if (!file.type) {
      return onRemove(file.id)
    }
    return onRemove(file._id)
  }, [file, hideMore, onRemove])

  const handleDownload = React.useCallback(async () => {
    // TODO: Handle download for uploaded file type
    if (file.type === 'SAVING' || file.type === 'NEW') {
      await downloadFile(file.data, file.fileName)
    }
  }, [file])

  return (
    <div className="column is-one-quarter">
      <div className="ob-files__box">
        <div className="ob-files__content">
          <FormElementFileDisplay file={file} />
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
                onClick={handleRemove}
              >
                Remove
              </a>
            </div>
          </div>
        </div>

        <div className="ob-files__file-name is-size-6">
          <span className="ob-files__file-name-inner">{file.fileName}</span>
          <FormElementFileStatus file={file} />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(FormElementFile)
