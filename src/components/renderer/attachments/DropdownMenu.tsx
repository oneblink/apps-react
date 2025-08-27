import * as React from 'react'
import clsx from 'clsx'
import { FormTypes } from '@oneblink/types'
import useBooleanState from '../../../hooks/useBooleanState'
import useClickOutsideElement from '../../../hooks/useClickOutsideElement'
import MaterialIcon from '../../MaterialIcon'

interface Props {
  element: FormTypes.FilesElement
  /** If set to `undefined`, the remove button will be hidden */
  onRemove: (() => void) | undefined
  onDownload?: () => void
  onRetry?: () => void
  attachmentUrl: string | null | undefined
  onAnnotate?: () => void
  onCrop?: () => void
}

const DropdownMenu = ({
  element,
  onRemove,
  onDownload,
  onRetry,
  attachmentUrl,
  onAnnotate,
  onCrop,
}: Props) => {
  const dropDownRef = React.useRef(null)
  const [isShowingMore, showMore, hideMore] = useBooleanState(false)

  useClickOutsideElement(
    dropDownRef,
    React.useCallback(() => {
      if (isShowingMore) {
        hideMore()
      }
    }, [hideMore, isShowingMore]),
  )

  return (
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
          <MaterialIcon className="ob-files__menu-icon">more_vert</MaterialIcon>
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
              role="menuitem"
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
              role="menuitem"
            >
              Download
            </a>
          )}
          {attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="dropdown-item cypress-file-open-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
              onClick={() => {
                hideMore()
              }}
            >
              <span>Open</span>
              <MaterialIcon className="icon-small">open_in_new</MaterialIcon>
            </a>
          )}
          {onRemove && (
            <a
              className={clsx('dropdown-item cypress-file-remove-button', {
                'ob-files__menu-remove-hidden': element.readOnly,
              })}
              onClick={() => {
                hideMore()
                onRemove()
              }}
              role="menuitem"
            >
              Remove
            </a>
          )}
          {onAnnotate && (
            <a
              className={clsx('dropdown-item cypress-file-annotate-button', {
                'ob-files__menu-annotate-hidden': element.readOnly,
              })}
              onClick={() => {
                hideMore()
                onAnnotate()
              }}
              role="menuitem"
            >
              Annotate
            </a>
          )}
          {onCrop && (
            <a
              className={clsx('dropdown-item cypress-file-crop-button', {
                'ob-files__menu-crop-hidden': element.readOnly,
              })}
              onClick={() => {
                hideMore()
                onCrop()
              }}
              role="menuitem"
            >
              Crop
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(DropdownMenu)
