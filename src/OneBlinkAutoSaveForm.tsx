import * as React from 'react'
import _throttle from 'lodash.throttle'
import { autoSaveService, Sentry } from '@oneblink/apps'

import OnLoading from './components/OnLoading'
import Modal from './components/Modal'
import OneBlinkForm from './OneBlinkForm'

type Props = React.ComponentProps<typeof OneBlinkForm> & {
  autoSaveKey?: string
}

function OneBlinkAutoSaveForm({
  form,
  autoSaveKey,
  initialSubmission,
  onCancel,
  onSubmit,
  onSaveDraft,
  ...rest
}: Props) {
  const [isUsingAutoSave, setIsUsingAutoSave] = React.useState<boolean | null>(
    null,
  )
  const [isAutoSaving, setIsAutoSaving] = React.useState(false)
  const [{ isLoading, autoSaveSubmission }, setAutoSaveState] = React.useState<{
    isLoading: boolean
    autoSaveSubmission: FormElementsCtrl['model'] | null
  }>({
    isLoading: true,
    autoSaveSubmission: null,
  })

  const throttledAutoSave = React.useMemo(() => {
    return _throttle(
      (model) => {
        setIsAutoSaving(true)
        console.log('Auto saving...')
        autoSaveService
          .upsertAutoSaveData(form.id, autoSaveKey, model)
          .catch((error) => {
            Sentry.captureException(error)
            console.warn('Error while auto saving', error)
          })
          .then(() => {
            setIsAutoSaving(false)
          })
      },
      9580, // https://en.wikipedia.org/wiki/100_metres
      { trailing: true, leading: false },
    )
  }, [autoSaveKey, form.id])

  const deleteAutoSaveData = React.useCallback(() => {
    return autoSaveService
      .deleteAutoSaveData(form.id, autoSaveKey)
      .catch((error) => {
        Sentry.captureException(error)
        console.warn('Error removing auto save data: ', error)
      })
  }, [autoSaveKey, form.id])

  const handleSubmit = React.useCallback(
    (submissionResult) => {
      throttledAutoSave.cancel()
      deleteAutoSaveData()
      onSubmit(submissionResult)
    },
    [deleteAutoSaveData, onSubmit, throttledAutoSave],
  )

  const handleSaveDraft = React.useCallback(
    (draftFormSubmissionResult) => {
      throttledAutoSave.cancel()
      deleteAutoSaveData()
      if (onSaveDraft) {
        onSaveDraft(draftFormSubmissionResult)
      }
    },
    [deleteAutoSaveData, onSaveDraft, throttledAutoSave],
  )

  const handleCancel = React.useCallback(() => {
    throttledAutoSave.cancel()
    deleteAutoSaveData()
    onCancel()
  }, [deleteAutoSaveData, onCancel, throttledAutoSave])

  React.useEffect(() => {
    let ignore = false
    const loadAutoSaveData = async () => {
      try {
        const autoSaveData = await autoSaveService.getAutoSaveData<
          FormElementsCtrl['model']
        >(form.id, autoSaveKey)
        if (!ignore) {
          setAutoSaveState({
            isLoading: false,
            autoSaveSubmission: autoSaveData,
          })
        }
      } catch (error) {
        Sentry.captureException(error)
        console.warn('Error loading auto save data', error)
        if (!ignore) {
          setAutoSaveState({
            isLoading: false,
            autoSaveSubmission: null,
          })
        }
      }
    }
    loadAutoSaveData()
    return () => {
      ignore = true
    }
  }, [autoSaveKey, form.id])

  // Clean up throttle function on unmount
  React.useEffect(() => {
    return () => {
      throttledAutoSave.cancel()
    }
  }, [throttledAutoSave])

  if (isLoading) {
    return (
      <div className="cypress-loading has-text-centered">
        <OnLoading className="has-text-centered"></OnLoading>
      </div>
    )
  }

  if (isUsingAutoSave === null && autoSaveSubmission) {
    return (
      <Modal
        isOpen
        title="Continue?"
        cardClassName="cypress-continue-auto-save"
        actions={
          <>
            <button
              type="button"
              className="button ob-button is-light cypress-continue-auto-save-start-again-button"
              onClick={() => {
                deleteAutoSaveData()
                setIsUsingAutoSave(false)
              }}
            >
              Start Again
            </button>
            <button
              type="button"
              className="button ob-button is-primary cypress-continue-auto-save-continue-button"
              onClick={() => setIsUsingAutoSave(true)}
            >
              Continue
            </button>
          </>
        }
      >
        We found an in progress submission, would you like to pick up where you
        left off or start again?
      </Modal>
    )
  }

  return (
    <>
      {isAutoSaving && (
        <i className="material-icons ob-form__auto-save-icon">sync</i>
      )}
      <OneBlinkForm
        {...rest}
        initialSubmission={
          isUsingAutoSave ? autoSaveSubmission : initialSubmission
        }
        form={form}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onSaveDraft={onSaveDraft && handleSaveDraft}
        onChange={throttledAutoSave}
      />
    </>
  )
}

export default React.memo(OneBlinkAutoSaveForm)
