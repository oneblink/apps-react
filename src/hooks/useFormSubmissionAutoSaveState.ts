import * as React from 'react'
import _throttle from 'lodash.throttle'
import { autoSaveService, submissionService, Sentry } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useFormSubmissionState from './useFormSubmissionState'
import { FormSubmissionModel } from '../types/form'
import { FormElement } from '@oneblink/types/typescript/forms'

export default function useFormSubmissionAutoSaveState({
  form,
  initialSubmission,
  removeAutoSaveDataBeforeSubmit,
  removeAutoSaveDataBeforeSaveDraft,
  autoSaveKey,
  onCancel,
  onSubmit,
  onSaveDraft,
}: {
  form: FormTypes.Form
  removeAutoSaveDataBeforeSubmit?: boolean
  removeAutoSaveDataBeforeSaveDraft?: boolean
  autoSaveKey: string
  onCancel: () => unknown
  onSubmit: (newFormSubmission: submissionService.NewFormSubmission) => unknown
  initialSubmission?: FormSubmissionModel
  onSaveDraft?: (
    newDraftSubmission: submissionService.NewDraftSubmission,
  ) => unknown
}) {
  const [{ definition, submission, lastElementUpdated }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const [
    { isLoadingAutoSaveSubmission, autoSaveSubmission },
    setAutoSaveState,
  ] = React.useState<{
    isLoadingAutoSaveSubmission: boolean
    autoSaveSubmission: FormSubmissionModel | null
    lastElementUpdated: FormElement | null
  }>({
    isLoadingAutoSaveSubmission: true,
    autoSaveSubmission: null,
    lastElementUpdated: null,
  })

  const throttledAutoSave = React.useMemo(() => {
    return _throttle(
      (model: FormSubmissionModel, lastElementUpdated?: FormElement) => {
        console.log('Auto saving...')
        autoSaveService
          .upsertAutoSaveData(definition.id, autoSaveKey, model)
          .then(() => {
            if (lastElementUpdated) {
              return autoSaveService.upsertAutoSaveData<FormElement>(
                definition.id,
                `LAST_ELEMENT_UPDATED_${autoSaveKey}`,
                lastElementUpdated,
              )
            }
          })
          .catch((error) => {
            console.warn('Error while auto saving', error)
            Sentry.captureException(error)
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
        console.warn('Error removing auto save data: ', error)
        Sentry.captureException(error)
      })
  }, [autoSaveKey, definition.id])

  const handleSubmit = React.useCallback(
    (submissionResult) => {
      cancelAutoSave()
      if (removeAutoSaveDataBeforeSubmit !== false) {
        deleteAutoSaveSubmission()
      }
      onSubmit(submissionResult)
    },
    [
      cancelAutoSave,
      deleteAutoSaveSubmission,
      onSubmit,
      removeAutoSaveDataBeforeSubmit,
    ],
  )

  const handleSaveDraft = React.useMemo(() => {
    if (onSaveDraft) {
      return (newDraftSubmission: submissionService.NewDraftSubmission) => {
        cancelAutoSave()
        if (removeAutoSaveDataBeforeSaveDraft !== false) {
          deleteAutoSaveSubmission()
        }
        if (onSaveDraft) {
          onSaveDraft(newDraftSubmission)
        }
      }
    }
  }, [
    cancelAutoSave,
    deleteAutoSaveSubmission,
    onSaveDraft,
    removeAutoSaveDataBeforeSaveDraft,
  ])

  const handleNavigateAway = React.useCallback(() => {
    cancelAutoSave()
    deleteAutoSaveSubmission()
  }, [cancelAutoSave, deleteAutoSaveSubmission])

  const handleCancel = React.useCallback(() => {
    cancelAutoSave()
    deleteAutoSaveSubmission()
    onCancel()
  }, [cancelAutoSave, deleteAutoSaveSubmission, onCancel])

  React.useEffect(() => {
    let ignore = false
    const loadAutoSaveData = async () => {
      try {
        const autoSaveSubmission =
          await autoSaveService.getAutoSaveData<FormSubmissionModel>(
            definition.id,
            autoSaveKey,
          )
        const lastElementUpdated =
          await autoSaveService.getAutoSaveData<FormElement>(
            definition.id,
            `LAST_ELEMENT_UPDATED_${autoSaveKey}`,
          )
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission,
            lastElementUpdated,
          })
        }
      } catch (error) {
        console.warn('Error loading auto save data', error)
        Sentry.captureException(error)
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission: null,
            lastElementUpdated: null,
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

  const setFormSubmissionAutoSave: typeof setFormSubmission = React.useCallback(
    (formSubmission) => {
      setFormSubmission((currentFormSubmission) => {
        const newFormSubmission =
          typeof formSubmission === 'function'
            ? formSubmission(currentFormSubmission)
            : formSubmission

        throttledAutoSave(
          newFormSubmission.submission,
          newFormSubmission.lastElementUpdated,
        )

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
      lastElementUpdated: null,
    })
  }, [deleteAutoSaveSubmission])

  const continueAutoSaveSubmission = React.useCallback(() => {
    if (autoSaveSubmission) {
      setFormSubmission((currentFormSubmission) => ({
        ...currentFormSubmission,
        submission: autoSaveSubmission,
        lastElementUpdated: lastElementUpdated,
      }))
    }
    setAutoSaveState({
      isLoadingAutoSaveSubmission: false,
      autoSaveSubmission: null,
      lastElementUpdated: null,
    })
  }, [autoSaveSubmission, setFormSubmission, lastElementUpdated])

  return {
    definition,
    submission,
    lastElementUpdated,
    isLoadingAutoSaveSubmission,
    isAutoSaveSubmissionAvailable: autoSaveSubmission !== null,
    startNewSubmission,
    continueAutoSaveSubmission,
    handleSubmit,
    handleCancel,
    handleSaveDraft,
    handleNavigateAway,
    setFormSubmission: setFormSubmissionAutoSave,
  }
}
