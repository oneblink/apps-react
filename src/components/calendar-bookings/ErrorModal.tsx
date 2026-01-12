import * as React from 'react'
import clsx from 'clsx'
import { OneBlinkAppsError } from '../../apps'
import OneBlinkAppsErrorOriginalMessage from '../renderer/OneBlinkAppsErrorOriginalMessage'
import sanitizeHtml from '../../services/sanitize-html'
import Modal from '../renderer/Modal'
import MaterialIcon from '../MaterialIcon'

type Props = {
  error: OneBlinkAppsError | Error | null
  closeButtonLabel?: string
  closeButtonClassName?: string
  onClose: () => unknown
}

function ErrorModal({
  error,
  closeButtonLabel,
  closeButtonClassName,
  onClose,
}: Props) {
  const displayError = React.useMemo(() => {
    if (!error) return
    let displayError

    if (!(error instanceof OneBlinkAppsError)) {
      displayError = new OneBlinkAppsError(error.message)
    } else {
      displayError = error
    }
    return displayError
  }, [error])

  const sanitizedHtml = React.useMemo(() => {
    if (!error) return ''
    return sanitizeHtml(error.message)
  }, [error])

  const handleClose = React.useCallback(async () => {
    if (!displayError) return

    onClose()
  }, [displayError, onClose])

  if (!displayError) {
    return null
  }

  return (
    <Modal
      isOpen
      title={displayError.title}
      className="cypress-error-modal"
      cardClassName={clsx({
        'has-text-centered': displayError.isOffline,
      })}
      titleClassName="cypress-error-title"
      bodyClassName="cypress-error-message"
      actions={
        <>
          <button
            type="button"
            className={clsx(
              'button ob-button cypress-close-error is-primary',
              closeButtonClassName,
            )}
            onClick={handleClose}
            autoFocus
          >
            {closeButtonLabel || 'Okay'}
          </button>
        </>
      }
    >
      <>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: sanitizedHtml,
          }}
        />
        {displayError.isOffline && (
          <MaterialIcon className="has-text-warning icon-x-large">
            wifi_off
          </MaterialIcon>
        )}
        <OneBlinkAppsErrorOriginalMessage error={displayError.originalError} />
      </>
    </Modal>
  )
}

export default React.memo<Props>(ErrorModal)
