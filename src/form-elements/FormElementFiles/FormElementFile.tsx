import * as React from 'react'
import clsx from 'clsx'
import useBooleanState from '../../hooks/useBooleanState'
import useClickOutsideElement from '../../hooks/useClickOutsideElement'
import downloadFile from '../../services/download-file'
import { FormTypes } from '@oneblink/types'
import { ValidAttachment } from '../../hooks/useAttachments'
import FormElementFileDisplay from './FormElementFileDisplay'
import FormElementFileStatus from './FormElementFileStatus'

type Props = {
  element: FormTypes.FilesElement
  onRemove: (index: number) => unknown
  file: ValidAttachment
  index: number
}

const FormElementFile = ({ element, onRemove, file, index }: Props) => {
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
  const handleRemove = React.useCallback((index) => onRemove(index), [onRemove])
  const handleDownload = React.useCallback(async () => {
    if (file.type === 'READY') {
      await downloadFile(file.data, file.fileName)
    }
  }, [file])

  return (
    <div className="column is-one-quarter" key={index}>
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

        <div className="ob-files__file-name is-size-6">
          <span className="ob-files__file-name-inner">{file.fileName}</span>
          <FormElementFileStatus file={file} />
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(FormElementFile)
