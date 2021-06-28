import * as React from 'react'
import _throttle from 'lodash.throttle'
import { autoSaveService, Sentry } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useFormSubmissionState from './useFormSubmissionState'
import { FormSubmissionModel } from '../types/form'

export default function useFormSubmissionAutoSaveState({
  form,
  initialSubmission,
  autoSaveKey,
  onCancel,
  onSubmit,
  onSaveDraft,
}: {
  form: FormTypes.Form
  autoSaveKey: string
  onCancel: () => unknown
  onSubmit: (newFormSubmission: SubmissionTypes.NewFormSubmission) => unknown
  initialSubmission?: FormSubmissionModel
  onSaveDraft?: (
    newDraftSubmission: SubmissionTypes.NewDraftSubmission,
  ) => unknown
}) {
  const [{ definition, submission }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const [
    { isLoadingAutoSaveSubmission, autoSaveSubmission },
    setAutoSaveState,
  ] = React.useState<{
    isLoadingAutoSaveSubmission: boolean
    autoSaveSubmission: FormSubmissionModel | null
  }>({
    isLoadingAutoSaveSubmission: true,
    autoSaveSubmission: null,
  })

  const throttledAutoSave = React.useMemo(() => {
    return _throttle(
      (model: FormSubmissionModel) => {
        console.log('Auto saving...')
        autoSaveService
          .upsertAutoSaveData(definition.id, autoSaveKey, model)
          .catch((error) => {
            Sentry.captureException(error)
            console.warn('Error while auto saving', error)
          })
      },
      9580, // https://en.wikipedia.org/wiki/100_metres
      { trailing: true, leading: false },
    )
  }, [autoSaveKey, definition.id])

  const cancelAutoSave = React.useCallback(() => {
    if (throttledAutoSave) {
      throttledAutoSave.cancel()
    }
  }, [throttledAutoSave])

  const deleteAutoSaveSubmission = React.useCallback(() => {
    return autoSaveService
      .deleteAutoSaveData(definition.id, autoSaveKey)
      .catch((error) => {
        Sentry.captureException(error)
        console.warn('Error removing auto save data: ', error)
      })
  }, [autoSaveKey, definition.id])

  const handleSubmit = React.useCallback(
    (submissionResult) => {
      cancelAutoSave()
      deleteAutoSaveSubmission()
      onSubmit(submissionResult)
    },
    [cancelAutoSave, deleteAutoSaveSubmission, onSubmit],
  )

  const handleSaveDraft = React.useMemo(() => {
    if (onSaveDraft) {
      return (newDraftSubmission: SubmissionTypes.NewDraftSubmission) => {
        cancelAutoSave()
        deleteAutoSaveSubmission()
        if (onSaveDraft) {
          onSaveDraft(newDraftSubmission)
        }
      }
    }
  }, [cancelAutoSave, deleteAutoSaveSubmission, onSaveDraft])

  const handleCancel = React.useCallback(() => {
    cancelAutoSave()
    deleteAutoSaveSubmission()
    onCancel()
  }, [cancelAutoSave, deleteAutoSaveSubmission, onCancel])

  React.useEffect(() => {
    let ignore = false
    const loadAutoSaveData = async () => {
      try {
        const autoSaveData =
          await autoSaveService.getAutoSaveData<FormSubmissionModel>(
            definition.id,
            autoSaveKey,
          )
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission: autoSaveData,
          })
        }
      } catch (error) {
        Sentry.captureException(error)
        console.warn('Error loading auto save data', error)
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission: null,
          })
        }
      }
    }
    loadAutoSaveData()
    return () => {
      ignore = true
    }
  }, [autoSaveKey, definition.id])

  // Clean up throttle function on unmount
  React.useEffect(() => {
    return () => {
      cancelAutoSave()
    }
  }, [cancelAutoSave])

  const setFormSubmissionAutoSave = React.useCallback(
    (formSubmission) => {
      setFormSubmission((currentFormSubmission) => {
        const newFormSubmission =
          typeof formSubmission === 'function'
            ? formSubmission(currentFormSubmission)
            : formSubmission

        throttledAutoSave(newFormSubmission.submission)

        return newFormSubmission
      })
    },
    [setFormSubmission, throttledAutoSave],
  )

  const startNewSubmission = React.useCallback(() => {
    deleteAutoSaveSubmission()
    setAutoSaveState({
      isLoadingAutoSaveSubmission: false,
      autoSaveSubmission: null,
    })
  }, [deleteAutoSaveSubmission])

  const continueAutoSaveSubmission = React.useCallback(() => {
    if (autoSaveSubmission) {
      setFormSubmission((currentFormSubmission) => ({
        ...currentFormSubmission,
        submission: autoSaveSubmission,
      }))
    }
    setAutoSaveState({
      isLoadingAutoSaveSubmission: false,
      autoSaveSubmission: null,
    })
  }, [autoSaveSubmission, setFormSubmission])

  return {
    definition,
    submission,
    isLoadingAutoSaveSubmission,
    isAutoSaveSubmissionAvailable: autoSaveSubmission !== null,
    startNewSubmission,
    continueAutoSaveSubmission,
    handleSubmit,
    handleCancel,
    handleSaveDraft,
    setFormSubmission: setFormSubmissionAutoSave,
  }
}
