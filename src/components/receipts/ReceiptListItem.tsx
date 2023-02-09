import * as React from 'react'
import clsx from 'clsx'
import utilsService from '../../services/utils-service'

type Props = {
  className: string
  valueClassName: string
  icon?: string
  label: string
  value: string
  allowCopyToClipboard?: boolean
}

function ReceiptListItem({
  className,
  valueClassName,
  icon,
  label,
  value,
  allowCopyToClipboard,
}: Props) {
  return (
    <div className={clsx('ob-list__item', className)}>
      {!!icon && (
        <div className="ob-list__avatar">
          <i className="material-icons icon-medium">{icon}</i>
        </div>
      )}
      <div className="ob-list__content-wrapper">
        <div className="ob-list__content">
          <div className="ob-list__text-secondary">{label}</div>
          <div className={clsx('ob-list__text-primary', valueClassName)}>
            {value}
          </div>
        </div>
      </div>
      {allowCopyToClipboard && (
        <div className="ob-list__actions">
          <button
            type="button"
            className="button ob-button ob-list__button is-small is-white tooltip has-tooltip-left"
            onClick={() => utilsService.copyToClipboard(value)}
            data-tooltip="Copy to clipboard"
          >
            <span className="icon has-text-grey">
              <i className="material-icons icon-small ob-icon__copy has-text">
                file_copy
              </i>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default React.memo(ReceiptListItem)
