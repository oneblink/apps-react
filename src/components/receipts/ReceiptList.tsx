import * as React from 'react'
import clsx from 'clsx'
import MaterialIcon from '../MaterialIcon'

type Props = {
  successIconClassName: string
  warningIconClassName?: string
  warningMessageClassName?: string
  warningMessage?: string
  children: React.ReactNode
}

function ReceiptList({
  successIconClassName,
  warningIconClassName,
  warningMessageClassName,
  warningMessage,
  children,
}: Props) {
  return (
    <div className="ob-list has-dividers has-shadow has-margin-bottom-4">
      <div className="ob-list__item">
        <div className="ob-list__content-wrapper">
          <div className="ob-list__content">
            {!warningMessage ? (
              <MaterialIcon
                className={clsx(
                  'has-text-centered has-text-success icon-x-large',
                  successIconClassName,
                )}
              >
                check_circle_outline
              </MaterialIcon>
            ) : (
              <>
                <MaterialIcon
                  className={clsx(
                    'has-text-centered has-text-danger icon-x-large',
                    warningIconClassName,
                  )}
                >
                  warning
                </MaterialIcon>

                <p
                  className={clsx('has-text-centered', warningMessageClassName)}
                >
                  {warningMessage}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

export default React.memo(ReceiptList)
