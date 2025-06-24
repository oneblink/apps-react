import * as React from 'react'
import _throttle from 'lodash.throttle'
import { autoSaveService, submissionService, Sentry } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useFormSubmissionState from './useFormSubmissionState'
import { FormElement } from '@oneblink/types/typescript/forms'
import { SectionState } from '../types/form'

/**
 * Use this if you want to implement a controlled auto saving form. See
 * {@link OneBlinkFormControlled} for a full example. If you do not need to
 * control the `submission` or `definition` properties, you can use the
 * {@link OneBlinkAutoSaveForm} component.
 *
 * @param options
 * @returns
 * @group Hooks
 */
export default function useFormSubmissionAutoSaveState({
  form,
  initialSubmission,
  resumeAtElement,
  removeAutoSaveDataBeforeSubmit,
  removeAutoSaveDataBeforeSaveDraft,
  autoSaveKey,
  formIsDisabled,
  onCancel,
  onSubmit,
  onSaveDraft,
  resumeSectionState,
}: {
  form: FormTypes.Form
  removeAutoSaveDataBeforeSubmit?: boolean
  removeAutoSaveDataBeforeSaveDraft?: boolean
  autoSaveKey: string
  formIsDisabled?: boolean
  onCancel: () => unknown
  onSubmit: (newFormSubmission: submissionService.NewFormSubmission) => unknown
  initialSubmission?: SubmissionTypes.S3SubmissionData['submission']
  resumeAtElement?: FormTypes.FormElement
  onSaveDraft?: (
    newDraftSubmission: submissionService.NewDraftSubmission,
  ) => unknown
  resumeSectionState?: SectionState
}) {
  const [
    {
      definition,
      submission,
      lastElementUpdated,
      executedLookups,
      sectionState,
    },
    setFormSubmission,
  ] = useFormSubmissionState(
    form,
    initialSubmission,
    resumeAtElement,
    resumeSectionState,
  )

  const [
    {
      isLoadingAutoSaveSubmission,
      autoSaveSubmission,
      autoSaveElement,
      autoSaveSectionState,
    },
    setAutoSaveState,
  ] = React.useState<{
    isLoadingAutoSaveSubmission: boolean
    autoSaveSubmission: SubmissionTypes.S3SubmissionData['submission'] | null
    autoSaveElement: FormElement | null
    autoSaveSectionState: SectionState | null
  }>({
    isLoadingAutoSaveSubmission: true,
    autoSaveSubmission: null,
    autoSaveElement: null,
    autoSaveSectionState: null,
  })

  const throttledAutoSave = React.useMemo(() => {
    return _throttle(
      (
        model: SubmissionTypes.S3SubmissionData['submission'],
        lastElementUpdated?: FormElement,
        sectionState?: SectionState,
      ) => {
        if (!formIsDisabled) {
          switch (lastElementUpdated?.type) {
            case 'summary':
            case 'calculation':
            case 'captcha': {
              return
            }
          }
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
            .then(() => {
              if (sectionState) {
                return autoSaveService.upsertAutoSaveData<{
                  sectionState: SectionState
                }>(definition.id, `SECTION_STATE_${autoSaveKey}`, {
                  sectionState,
                })
              }
            })
            .catch((error) => {
              console.warn('Error while auto saving', error)
              Sentry.captureException(error)
            })
        }
      },
      9580, // https://en.wikipedia.org/wiki/100_metres
      { trailing: true, leading: false },
    )
  }, [autoSaveKey, definition.id, formIsDisabled])

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
    (submissionResult: submissionService.NewFormSubmission) => {
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
        const autoSaveSubmission = await autoSaveService.getAutoSaveData<
          SubmissionTypes.S3SubmissionData['submission']
        >(definition.id, autoSaveKey)
        const autoSaveElement =
          await autoSaveService.getAutoSaveData<FormElement>(
            definition.id,
            `LAST_ELEMENT_UPDATED_${autoSaveKey}`,
          )
        const autoSaveSectionStateData = await autoSaveService.getAutoSaveData<{
          sectionState: SectionState
        }>(definition.id, `SECTION_STATE_${autoSaveKey}`)
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission,
            autoSaveElement,
            autoSaveSectionState:
              autoSaveSectionStateData?.sectionState || null,
          })
        }
      } catch (error) {
        console.warn('Error loading auto save data', error)
        Sentry.captureException(error)
        if (!ignore) {
          setAutoSaveState({
            isLoadingAutoSaveSubmission: false,
            autoSaveSubmission: null,
            autoSaveElement: null,
            autoSaveSectionState: null,
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
          newFormSubmission.sectionState,
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
      autoSaveElement: null,
      autoSaveSectionState: null,
    })
  }, [deleteAutoSaveSubmission])

  const continueAutoSaveSubmission = React.useCallback(() => {
    if (autoSaveSubmission) {
      setFormSubmission((currentFormSubmission) => ({
        ...currentFormSubmission,
        submission: autoSaveSubmission,
        lastElementUpdated: autoSaveElement ? autoSaveElement : undefined,
        sectionState: autoSaveSectionState || [],
      }))
    }
    setAutoSaveState({
      isLoadingAutoSaveSubmission: false,
      autoSaveSubmission: null,
      autoSaveElement: null,
      autoSaveSectionState: null,
    })
  }, [
    autoSaveSubmission,
    setFormSubmission,
    autoSaveElement,
    autoSaveSectionState,
  ])

  React.useEffect(() => {
    if (form.continueWithAutosave) {
      continueAutoSaveSubmission()
    }
  }, [continueAutoSaveSubmission, form.continueWithAutosave])

  return {
    definition,
    submission,
    lastElementUpdated,
    executedLookups,
    sectionState,
    isLoadingAutoSaveSubmission,
    isAutoSaveSubmissionAvailable:
      autoSaveSubmission !== null && !form.continueWithAutosave,
    startNewSubmission,
    continueAutoSaveSubmission,
    handleSubmit,
    handleCancel,
    handleSaveDraft,
    handleNavigateAway,
    setFormSubmission: setFormSubmissionAutoSave,
  }
}
