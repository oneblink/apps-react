import * as React from 'react'
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button,
  Portal,
  DialogProps,
} from '@mui/material'
import useIsMounted from '../hooks/useIsMounted'
import ErrorSnackbar from './ErrorSnackbar'

type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (abortSignal: AbortSignal) => unknown
  children: React.ReactNode
  title: string
  confirmButtonText: string
  confirmButtonIcon: React.ReactNode
  cypress?: {
    dialog?: string
    confirmButton?: string
    cancelButton?: string
    error?: string
    title?: string
  }
  TransitionProps?: DialogProps['TransitionProps']
  disabled?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  children,
  onConfirm,
  title,
  confirmButtonText,
  confirmButtonIcon,
  cypress,
  TransitionProps,
  disabled,
}: Props) {
  const isMounted = useIsMounted()
  const [isConfirming, setIsConfirming] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const handleConfirm = React.useCallback(async () => {
    setIsConfirming(true)
    setError(null)
    let newError = null

    const abortController = new AbortController()
    try {
      await onConfirm(abortController.signal)
    } catch (error) {
      newError = error as Error
    }

    if (isMounted.current && !abortController.signal.aborted) {
      setIsConfirming(false)
      setError(newError)
    }
  }, [isMounted, onConfirm])
  return (
    <React.Fragment>
      <Dialog
        open={isOpen}
        maxWidth="sm"
        fullWidth
        onClose={!isConfirming ? onClose : undefined}
        data-cypress={cypress?.dialog}
        TransitionProps={{
          onExiting: () => setError(null),
          ...(TransitionProps ? TransitionProps : {}),
        }}
      >
        <DialogTitle data-cypress={cypress?.title}>{title}</DialogTitle>
        <DialogContent dividers>{children}</DialogContent>
        <DialogActions>
          <Button
            disabled={isConfirming}
            onClick={onClose}
            data-cypress={cypress?.cancelButton}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            loading={isConfirming}
            autoFocus
            startIcon={confirmButtonIcon}
            loadingPosition="start"
            onClick={handleConfirm}
            data-cypress={cypress?.confirmButton}
            disabled={disabled}
          >
            {confirmButtonText}
          </Button>
        </DialogActions>
      </Dialog>
      <Portal>
        <ErrorSnackbar open={!!error} onClose={setError}>
          <span data-cypress={cypress?.error}>{error?.message}</span>
        </ErrorSnackbar>
      </Portal>
    </React.Fragment>
  )
}
