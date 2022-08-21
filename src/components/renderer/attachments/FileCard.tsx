import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../../../hooks/useBooleanState'
import useClickOutsideElement from '../../../hooks/useClickOutsideElement'
import { FormTypes } from '@oneblink/types'
import FileCardContent from './FileCardContent'
import AttachmentStatus from './AttachmentStatus'
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from '../../../services/form-validation'

type Props = {
  element: FormTypes.FilesElement
  isUploading?: boolean
  isUploadPaused?: boolean
  uploadErrorMessage?: string
  loadImageUrlError?: Error
  isLoadingImageUrl?: boolean
  fileName: string
  imageUrl: string | undefined | null
  onRemove: () => void
  onDownload?: () => void
  onRetry?: () => void
}

function FileCard({
  element,
  isUploading,
  isUploadPaused,
  uploadErrorMessage,
  loadImageUrlError,
  isLoadingImageUrl,
  imageUrl,
  fileName,
  onDownload,
  onRemove,
  onRetry,
}: Props) {
  const dropDownRef = React.useRef(null)
  const [isShowingMore, showMore, hideMore] = useBooleanState(false)

  const uploadError = React.useMemo(() => {
    if (!checkFileNameIsValid(element, fileName)) {
      return new Error(`${fileName.split('.').pop()} files are not allowed`)
    }
    if (!checkFileNameExtensionIsValid(element, fileName)) {
      return new Error(`${fileName} must have an extension`)
    }
    if (uploadErrorMessage) {
      return new Error(uploadErrorMessage)
    }
  }, [element, fileName, uploadErrorMessage])

  useClickOutsideElement(
    dropDownRef,
    React.useCallback(() => {
      if (isShowingMore) {
        hideMore()
      }
    }, [hideMore, isShowingMore]),
  )

  return (
    <div className="column is-one-quarter">
      <div className="ob-files__box">
        <div className="ob-files__content">
          <FileCardContent imageUrl={imageUrl} />
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
              {onRetry && (
                <a
                  className="dropdown-item cypress-file-retry-button"
                  onClick={() => {
                    hideMore()
                    onRetry()
                  }}
                >
                  Retry
                </a>
              )}
              {onDownload && (
                <a
                  className="dropdown-item cypress-file-download-button"
                  onClick={() => {
                    hideMore()
                    onDownload()
                  }}
                >
                  Download
                </a>
              )}
              <a
                className={clsx('dropdown-item cypress-file-remove-button', {
                  'ob-files__menu-remove-hidden': element.readOnly,
                })}
                onClick={() => {
                  hideMore()
                  onRemove()
                }}
              >
                Remove
              </a>
            </div>
          </div>
        </div>

        <div className="ob-files__file-name is-size-6">
          <span className="ob-files__file-name-inner">{fileName}</span>
          <AttachmentStatus
            isUploading={isUploading}
            isUploadPaused={isUploadPaused}
            uploadError={uploadError}
            loadImageUrlError={loadImageUrlError}
            isLoadingImageUrl={isLoadingImageUrl}
            imageUrl={imageUrl}
          />
        </div>
      </div>
    </div>
  )
}

export default React.memo(FileCard)
