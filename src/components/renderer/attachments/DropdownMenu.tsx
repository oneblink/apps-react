import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../../../hooks/useBooleanState'
import useClickOutsideElement from '../../../hooks/useClickOutsideElement'
import { FormTypes } from '@oneblink/types'

interface Props {
  element: FormTypes.FilesElement
  onRemove: () => void
  onDownload?: () => void
  onRetry?: () => void
}

const DropdownMenu = ({ element, onRemove, onDownload, onRetry }: Props) => {
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
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(DropdownMenu)
