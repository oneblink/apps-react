import * as React from 'react'
import {
  createTheme as createMuiTheme,
  ThemeProvider,
  Tooltip,
} from '@mui/material'
import { Prompt, useHistory } from 'react-router-dom'
import clsx from 'clsx'
import * as bulmaToast from 'bulma-toast'
import { localisationService, submissionService } from '@oneblink/apps'
import {
  FormTypes,
  FormsAppsTypes,
  ScheduledTasksTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { attachmentsService } from '@oneblink/apps'
import * as H from 'history'

import Modal from './components/renderer/Modal'
import cleanFormSubmissionModel from './services/cleanFormSubmissionModel'
import PageFormElements from './components/renderer/PageFormElements'
import useFormValidation from './hooks/useFormValidation'
import useConditionalLogic from './hooks/useConditionalLogic'
import usePages from './hooks/usePages'
import useLookups from './hooks/useLookups'
import { FormDefinitionContext } from './hooks/useFormDefinition'
import { InjectPagesContext } from './hooks/useInjectPages'
import { FormElementOptionsContextProvider } from './hooks/useDynamicOptionsLoaderState'
import { FormElementLookupsContextProvider } from './hooks/useFormElementLookups'
import { GoogleMapsApiKeyContext } from './hooks/useGoogleMapsApiKey'
import { AbnLookupAuthenticationGuidContext } from './hooks/useAbnLookupAuthenticationGuid'
import { CaptchaSiteKeyContext } from './hooks/useCaptchaSiteKey'
import { FormIsReadOnlyContext } from './hooks/useFormIsReadOnly'
import { AttachmentBlobsProvider } from './hooks/attachments/useAttachmentBlobs'
import useIsOffline from './hooks/useIsOffline'
import CustomisableButtonInner from './components/renderer/CustomisableButtonInner'
import {
  ExecutedLookups,
  FormElementsValidation,
  NestedFormElementValueChangeHandler,
  SetFormSubmission,
} from './types/form'
import checkBsbsAreInvalid from './services/checkBsbsAreInvalid'
import checkIfBsbsAreValidating from './services/checkIfBsbsAreValidating'
import checkIfAttachmentsExist from './services/checkIfAttachmentsExist'
import useAuth from './hooks/useAuth'
import { formElementsService } from '@oneblink/sdk-core'
import { TaskContext } from './hooks/useTaskContext'
import { onUploadAttachmentConfiguration } from './types/attachments'

export type OneBlinkReadOnlyFormProps = {
  /**
   * A [Google Maps API
   * Key](https://developers.google.com/maps/documentation/javascript/get-api-key).
   * Required if the form contains a `location` form element.
   */
  googleMapsApiKey?: string
  /** Hex colour value for certain inputs (defaults to `#4c8da7`). */
  primaryColour?: string
  /**
   * Pass a task if the user was attempting to complete a scheduled task via a
   * form submission
   */
  task?: ScheduledTasksTypes.Task
  /**
   * Pass a task group if the user was attempting to complete a scheduled task
   * associated with a group via a form submission
   */
  taskGroup?: ScheduledTasksTypes.TaskGroup
  /**
   * Pass a task group instance if the user was attempting to complete a
   * scheduled task associated with a group via a form submission
   */
  taskGroupInstance?: ScheduledTasksTypes.TaskGroupInstance
}

export type OneBlinkFormBaseProps = OneBlinkReadOnlyFormProps & {
  /** The function to call when the user cancels the form */
  onCancel: () => unknown
  /**
   * The function to call when the user submits the form with valid submission
   * data. See
   * [NewFormSubmission](https://oneblink.github.io/apps/modules/submissionService.html#NewFormSubmission)
   * for the structure of the argument.
   */
  onSubmit: (newFormSubmission: submissionService.NewFormSubmission) => unknown
  /** Whether the form is currently able to be submitted. False by default. */
  disabled?: boolean
  /** Whether the form is in preview mode. False by default. */
  isPreview?: boolean
  /**
   * An [ABN Lookup Authentication
   * Guid](https://abr.business.gov.au/Tools/WebServices). Required if the form
   * contains a `abn` form element.
   */
  abnLookupAuthenticationGuid?: string
  /**
   * A [reCAPTCHA Site Key](https://developers.google.com/recaptcha/intro).
   * Required if the form contains a `captcha` form element.
   */
  captchaSiteKey?: string
  /** Change properties for certain buttons on the form. */
  buttons?: FormsAppsTypes.FormsListStyles['buttons']
  /** Number of days attachments are retained for. */
  attachmentRetentionInDays?: number
  /**
   * If set to `false`, submission will be prevented while offline. If set to
   * `true`, the user will be prompted to allow them to continue with
   * attachments uploading in the background later.
   */
  isPendingQueueEnabled: boolean
  /**
   * The function to call when the user wishes to save their submission data as
   * a draft submission. If not specified, drafts cannot be saved. See
   * [NewDraftSubmission](https://oneblink.github.io/apps/modules/submissionService.html#NewDraftSubmission)
   * for the structure of the argument.
   */
  onSaveDraft?: (
    newDraftSubmission: submissionService.NewDraftSubmission,
  ) => unknown
  /**
   * The function to call when the user needs to navigate away from the form.
   * e.g. `history.push`
   */
  handleNavigateAway?: () => unknown
  /**
   * Determines whether the form is submittable or not. Info page type forms
   * show a "Done" button instead of a "Submit" button. Defaults to
   * "CALCULATED"
   */
  isInfoPage?: 'YES' | 'NO' | 'CALCULATED'
  /** The function to call when a user uploads an attachment through an element that
   * allows attachment upload. See [uploadAttachment](https://oneblink.github.io/apps/modules/attachmentsService.html#uploadAttachment)
   * for the structure of the argument and a sample function to be used.
   */
  onUploadAttachment?: (
    upload: onUploadAttachmentConfiguration,
    abortSignal?: AbortSignal,
  ) => Promise<SubmissionTypes.FormSubmissionAttachment>
}

export type OneBlinkFormUncontrolledProps = {
  /** The OneBlink Form to render */
  form: FormTypes.Form
  /** The initial submission data */
  initialSubmission?: SubmissionTypes.S3SubmissionData['submission']
}

export type OneBlinkFormControlledProps = {
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
  setFormSubmission: SetFormSubmission
  lastElementUpdated?: FormTypes.FormElement
  executedLookups: ExecutedLookups
}

type Props = OneBlinkFormBaseProps &
  OneBlinkFormControlledProps & {
    isReadOnly: boolean
  }

function OneBlinkFormBase({
  googleMapsApiKey,
  abnLookupAuthenticationGuid,
  captchaSiteKey,
  definition,
  disabled,
  isPreview,
  submission,
  isReadOnly,
  onCancel,
  onSubmit,
  onSaveDraft,
  setFormSubmission,
  buttons,
  primaryColour,
  attachmentRetentionInDays,
  isPendingQueueEnabled,
  handleNavigateAway,
  isInfoPage: isInfoPageProp,
  lastElementUpdated,
  executedLookups,
  task,
  taskGroup,
  taskGroupInstance,
  onUploadAttachment,
}: Props) {
  const isOffline = useIsOffline()
  const { isUsingFormsKey } = useAuth()

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          primary: {
            main: primaryColour || '#4c8da7',
          },
          success: {
            main: '#4caf50',
          },
        },
      }),
    [primaryColour],
  )

  const isInfoPage = React.useMemo(() => {
    if (!!isInfoPageProp && isInfoPageProp !== 'CALCULATED') {
      return isInfoPageProp === 'YES'
    }
    return formElementsService.determineIsInfoPage(definition)
  }, [definition, isInfoPageProp])

  //
  //
  // #region Form Definition

  const pages = React.useMemo<FormTypes.PageElement[]>(() => {
    if (definition.isMultiPage) {
      return definition.elements.reduce(
        (
          pageElements: FormTypes.PageElement[],
          formElement: FormTypes.FormElement,
        ) => {
          if (formElement.type === 'page') {
            pageElements.push(formElement)
          }
          return pageElements
        },
        [],
      )
    } else {
      return [
        {
          type: 'page',
          id: definition.id.toString(),
          label: definition.name,
          elements: definition.elements,
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
        },
      ]
    }
  }, [
    definition.elements,
    definition.id,
    definition.isMultiPage,
    definition.name,
  ])

  // #endregion
  //
  //

  //
  //
  // #region Unsaved Changed

  const history = useHistory()

  const [
    { isDirty, isNavigationAllowed, hasConfirmedNavigation, goToLocation },
    setUnsavedChangesState,
  ] = React.useState<{
    isDirty: boolean
    isNavigationAllowed: boolean
    hasConfirmedNavigation: boolean | null
    goToLocation: H.Location | null
  }>({
    isDirty: false,
    isNavigationAllowed: false,
    hasConfirmedNavigation: null,
    goToLocation: null,
  })
  const [promptOfflineSubmissionAttempt, setPromptOfflineSubmissionAttempt] =
    React.useState<boolean>(false)
  const [promptUploadingAttachments, setPromptUploadingAttachments] =
    React.useState<boolean>(false)
  const handleBlockedNavigation = React.useCallback<
    (location: H.Location, action: H.Action) => string | boolean
  >((location) => {
    setUnsavedChangesState((current) => ({
      ...current,
      goToLocation: location,
      hasConfirmedNavigation: false,
    }))
    return false
  }, [])

  const handleKeepGoing = React.useCallback(() => {
    setUnsavedChangesState((current) => ({
      ...current,
      goToLocation: null,
      hasConfirmedNavigation: null,
    }))
  }, [])

  const handleDiscardUnsavedChanges = React.useCallback(() => {
    setUnsavedChangesState((current) => ({
      ...current,
      isNavigationAllowed: true,
      hasConfirmedNavigation: true,
    }))
  }, [])

  React.useEffect(() => {
    if (hasConfirmedNavigation) {
      // Navigate to the previous blocked location with your navigate function
      if (goToLocation) {
        history.push(`${goToLocation.pathname}${goToLocation.search}`)
        if (handleNavigateAway) {
          handleNavigateAway()
        }
      } else {
        onCancel()
      }
    }
  }, [
    goToLocation,
    handleNavigateAway,
    hasConfirmedNavigation,
    history,
    onCancel,
  ])

  const handleCancel = React.useCallback(() => {
    if (isDirty) {
      setUnsavedChangesState((current) => ({
        ...current,
        hasConfirmedNavigation: false,
      }))
    } else {
      onCancel()
    }
  }, [isDirty, onCancel])

  const allowNavigation = React.useCallback(() => {
    setUnsavedChangesState((current) => ({
      ...current,
      isNavigationAllowed: true,
    }))
  }, [])

  // #endregion Unsaved Changed
  //
  //

  //
  //
  // #region Conditional Logic

  const { formElementsConditionallyShown, conditionalLogicError } =
    useConditionalLogic(definition, submission)

  // #endregion
  //
  //

  //
  //
  // #region Validation

  const { validate } = useFormValidation(pages)

  const formElementsValidation = React.useMemo<
    FormElementsValidation | undefined
  >(
    () =>
      !isReadOnly
        ? validate(
            submission,
            formElementsConditionallyShown,
            executedLookups ?? {},
          )
        : undefined,
    [
      formElementsConditionallyShown,
      isReadOnly,
      submission,
      validate,
      executedLookups,
    ],
  )

  // #endregion
  //
  //

  //
  //
  // #region Pages

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false)

  const {
    visiblePages,
    isFirstVisiblePage,
    isLastVisiblePage,
    isDisplayingCurrentPageError,
    isShowingMultiplePages,
    isStepsHeaderActive,
    toggleStepsNavigation,
    currentPageIndex,
    currentPage,
    currentPageNumber,
    checkDisplayPageError,
    setPageId,
    goToPreviousPage,
    goToNextPage,
    scrollToTopOfPageHTMLElementRef,
  } = usePages({
    hasAttemptedSubmit,
    pages,
    formElementsValidation,
    formElementsConditionallyShown,
  })

  // #endregion
  //
  //

  //
  //
  // #region Submissions

  const getCurrentSubmissionData = React.useCallback(
    (stripBinaryData: boolean) => {
      const { model, captchaTokens } = cleanFormSubmissionModel(
        submission,
        definition.elements,
        formElementsConditionallyShown,
        stripBinaryData,
      )
      return {
        submission: model,
        captchaTokens,
      }
    },
    [definition.elements, formElementsConditionallyShown, submission],
  )

  const obFormContainerHTMLElementRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const obFormContainerHTMLElement = obFormContainerHTMLElementRef.current
    if (obFormContainerHTMLElement) {
      console.log(
        'Setting toast notifications to be appended to HTML Element',
        obFormContainerHTMLElement,
      )
      bulmaToast.setDefaults({
        position: 'bottom-right',
        opacity: 0.95,
        appendTo: obFormContainerHTMLElement,
      })
    }
    return () => {
      bulmaToast.resetDefaults()
    }
  }, [])

  const checkAttachmentsCanBeSubmitted = React.useCallback(
    (submission: SubmissionTypes.S3SubmissionData['submission']) => {
      // Prevent submission until all attachment uploads are finished
      // Unless the user is offline, in which case, the uploads will
      // be taken care of by a pending queue if enabled, otherwise
      // the user will be prompted to try again or save a draft.
      if (isOffline) {
        return true
      }
      const attachmentsAreUploading =
        attachmentsService.checkIfAttachmentsAreUploading(
          definition,
          submission,
        )

      if (attachmentsAreUploading) {
        if (isUsingFormsKey || !isPendingQueueEnabled) {
          bulmaToast.toast({
            message:
              'Attachments are still uploading, please wait for them to finish before trying again.',
            type: 'is-primary',
            extraClasses: 'ob-toast cypress-still-uploading-toast',
            duration: 4000,
            pauseOnHover: true,
            closeOnClick: true,
          })
          return false
        } else {
          setPromptUploadingAttachments(true)
          return false
        }
      }

      return true
    },
    [definition, isOffline, isPendingQueueEnabled, isUsingFormsKey],
  )

  const checkBsbsCanBeSubmitted = React.useCallback(
    (submission: SubmissionTypes.S3SubmissionData['submission']) => {
      return !checkBsbsAreInvalid(definition, submission)
    },
    [definition],
  )

  const checkBsbAreValidating = React.useCallback(
    (submission: SubmissionTypes.S3SubmissionData['submission']) => {
      if (checkIfBsbsAreValidating(definition, submission)) {
        bulmaToast.toast({
          message:
            'Bsb(s) are still being validated, please wait for them to finish before trying again.',
          type: 'is-primary',
          extraClasses: 'ob-toast cypress-still-validating-toast',
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return false
      }

      return true
    },
    [definition],
  )

  const handleSubmit = React.useCallback(
    (
      event:
        | React.FormEvent<HTMLFormElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
      continueWhilstAttachmentsAreUploading: boolean,
    ) => {
      event.preventDefault()
      if (disabled || isReadOnly) return
      setHasAttemptedSubmit(true)

      const submissionData = getCurrentSubmissionData(false)
      if (!checkBsbAreValidating(submissionData.submission)) {
        return
      }
      if (formElementsValidation) {
        console.log('Validation errors', formElementsValidation)
        bulmaToast.toast({
          message: 'Please fix validation errors',
          type: 'is-danger',
          extraClasses: 'ob-toast cypress-invalid-submit-attempt',
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return
      }
      if (!checkBsbsCanBeSubmitted(submissionData.submission)) {
        return
      }
      if (
        !continueWhilstAttachmentsAreUploading &&
        !checkAttachmentsCanBeSubmitted(submissionData.submission)
      ) {
        return
      }
      // check if attachments exist
      const newSubmission = checkIfAttachmentsExist(
        definition,
        submissionData.submission,
        attachmentRetentionInDays,
      )
      if (newSubmission) {
        setFormSubmission((currentFormSubmission) => ({
          ...currentFormSubmission,
          submission: newSubmission,
        }))
        bulmaToast.toast({
          message:
            "Some files that were included in your submission have been removed based on your administrator's data retention policy, please remove them and upload them again.",
          type: 'is-danger',
          extraClasses: 'ob-toast cypress-invalid-submit-attempt',
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return
      }

      if (isOffline && !isPendingQueueEnabled) {
        console.log('User is offline and form does not support a pending queue')
        setPromptOfflineSubmissionAttempt(true)
        return
      }

      allowNavigation()

      onSubmit({
        definition,
        submission: submissionData.submission,
        captchaTokens: submissionData.captchaTokens,
      })
    },
    [
      disabled,
      isReadOnly,
      getCurrentSubmissionData,
      checkBsbAreValidating,
      formElementsValidation,
      checkBsbsCanBeSubmitted,
      definition,
      attachmentRetentionInDays,
      isOffline,
      isPendingQueueEnabled,
      allowNavigation,
      onSubmit,
      checkAttachmentsCanBeSubmitted,
      setFormSubmission,
    ],
  )

  const handleSaveDraft = React.useCallback(
    (continueWhilstAttachmentsAreUploading: boolean) => {
      if (disabled) return
      if (onSaveDraft) {
        allowNavigation()

        // For drafts we don't need to save the captcha tokens,
        // they will need to prove they are not robot again
        const { submission } = getCurrentSubmissionData(false)
        if (!checkBsbAreValidating(submission)) {
          return
        }
        if (
          !continueWhilstAttachmentsAreUploading &&
          !checkAttachmentsCanBeSubmitted(submission)
        ) {
          return
        }
        onSaveDraft({
          definition,
          submission,
          backgroundUpload: continueWhilstAttachmentsAreUploading,
          lastElementUpdated,
        })
      }
    },
    [
      allowNavigation,
      checkAttachmentsCanBeSubmitted,
      definition,
      disabled,
      getCurrentSubmissionData,
      onSaveDraft,
      checkBsbAreValidating,
      lastElementUpdated,
    ],
  )

  const handleContinueWithAttachments = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      setPromptUploadingAttachments(false)
      if (hasAttemptedSubmit) {
        handleSubmit(e, true)
      } else {
        handleSaveDraft(true)
      }
    },
    [
      handleSubmit,
      setPromptUploadingAttachments,
      hasAttemptedSubmit,
      handleSaveDraft,
    ],
  )
  const handleWaitForAttachments = React.useCallback(() => {
    setPromptUploadingAttachments(false)
  }, [setPromptUploadingAttachments])

  // #endregion
  //
  //

  //
  //
  // #region Lookups

  const { handlePagesLookupResult } = useLookups(
    definition.id,
    setFormSubmission,
  )

  // #endregion
  //
  //

  //
  //
  // #region Submission/Definition Changes

  const handleChange = React.useCallback<NestedFormElementValueChangeHandler>(
    (element, { value, executedLookups }) => {
      if (
        //This will ensure on a read only form that the summary and calculation elements
        //can still be displayed as it needs handleChange so it can render
        //due to the dynamic nature of the summary element.
        (disabled &&
          element.type !== 'summary' &&
          element.type !== 'calculation') ||
        element.type === 'page' ||
        element.type === 'section'
      ) {
        return
      }

      setUnsavedChangesState((current) => ({
        ...current,
        isDirty: true,
      }))
      // dont update the last element updated for elements the user cannot set the value of
      if (element.type === 'summary' || element.type === 'calculation') {
        setFormSubmission((currentFormSubmission) => ({
          ...currentFormSubmission,
          submission: {
            ...currentFormSubmission.submission,
            [element.name]:
              typeof value === 'function'
                ? value(currentFormSubmission.submission[element.name])
                : value,
          },
        }))
      } else {
        setFormSubmission((currentFormSubmission) => {
          return {
            ...currentFormSubmission,
            submission: {
              ...currentFormSubmission.submission,
              [element.name]:
                typeof value === 'function'
                  ? value(currentFormSubmission.submission[element.name])
                  : value,
            },
            lastElementUpdated: element,
            executedLookups: {
              ...currentFormSubmission.executedLookups,
              [element.name]:
                typeof executedLookups === 'function'
                  ? executedLookups(
                      currentFormSubmission.executedLookups?.[element.name],
                    )
                  : executedLookups,
            },
          }
        })
      }
    },
    [disabled, setFormSubmission],
  )

  // #endregion
  //
  //

  const taskContextValue = React.useMemo(() => {
    return {
      task,
      taskGroup,
      taskGroupInstance,
    }
  }, [task, taskGroup, taskGroupInstance])

  const lastElementUpdatedExistsOnForm = React.useMemo(() => {
    return !!formElementsService.findFormElement(
      definition.elements,
      (el) => el.id === lastElementUpdated?.id,
    )
  }, [definition.elements, lastElementUpdated])

  const lastElementUpdatedPage = React.useMemo(() => {
    return definition.elements.find((pageElement: FormTypes.FormElement) => {
      if (pageElement.type === 'page') {
        return formElementsService.findFormElement(
          pageElement.elements,
          (el) => el.id === lastElementUpdated?.id,
        )
      }
    })
  }, [lastElementUpdated, definition])

  const [hasResumed, setHasResumed] = React.useState(false)
  React.useEffect(() => {
    if (!hasResumed) {
      if (lastElementUpdated && lastElementUpdatedExistsOnForm) {
        if (lastElementUpdatedPage) {
          setPageId(lastElementUpdatedPage.id)
        }
        const element = document.getElementById(lastElementUpdated.id)
        if (element) {
          window.requestAnimationFrame(() => {
            element.scrollIntoView({ behavior: 'smooth' })
          })
        }
      }
      setHasResumed(true)
    }
  }, [
    lastElementUpdated,
    hasResumed,
    lastElementUpdatedPage,
    lastElementUpdatedExistsOnForm,
    setPageId,
  ])

  if (conditionalLogicError) {
    return (
      <>
        <div className="has-text-centered">
          <i className="material-icons has-text-warning icon-x-large">error</i>
          <h3 className="title is-3">Bad Form Configuration</h3>
          <p className="cypress-conditional-logic-error-message">
            {conditionalLogicError.message}
          </p>
          <p className="has-text-grey">
            {localisationService.formatDatetimeLong(new Date())}
          </p>
        </div>
      </>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <FormDefinitionContext.Provider value={definition}>
        <FormElementOptionsContextProvider>
          <FormElementLookupsContextProvider>
            <div
              className="ob-form-container"
              ref={obFormContainerHTMLElementRef}
            >
              <form
                name="obForm"
                className={`ob-form cypress-ob-form ob-form__page-${
                  currentPageIndex + 1
                }`}
                noValidate
                onSubmit={(e) => handleSubmit(e, false)}
              >
                <div>
                  <div ref={scrollToTopOfPageHTMLElementRef} />
                  {isShowingMultiplePages && (
                    <div
                      className={clsx('ob-steps-navigation', {
                        'is-active': isStepsHeaderActive,
                      })}
                    >
                      <div
                        className={clsx('ob-steps-navigation__header', {
                          'is-active': isStepsHeaderActive,
                        })}
                        onClick={toggleStepsNavigation}
                      >
                        <span className="icon is-invisible">
                          <i className="material-icons">keyboard_arrow_down</i>
                        </span>
                        <div className="steps-header-active-page">
                          {isDisplayingCurrentPageError ? (
                            <span className="icon">
                              <i className="material-icons has-text-danger is-size-4">
                                warning
                              </i>
                            </span>
                          ) : (
                            <span className="steps-header-active-page-icon">
                              {currentPageNumber}
                            </span>
                          )}
                          <span className="steps-header-active-page-label cypress-tablet-step-title">
                            {currentPage ? currentPage.label : ''}
                          </span>
                        </div>
                        <span className="dropdown icon">
                          <i className="material-icons">keyboard_arrow_down</i>
                        </span>
                      </div>

                      <div
                        className={clsx('ob-steps-navigation__steps', {
                          'is-active': isStepsHeaderActive,
                        })}
                      >
                        <div className="steps is-small is-horizontal-tablet cypress-steps">
                          {visiblePages.map(
                            (page: FormTypes.PageElement, index: number) => {
                              const hasErrors = checkDisplayPageError(page)
                              return (
                                <div
                                  key={page.id}
                                  id={`steps-navigation-step-${page.id}`}
                                  className={clsx(
                                    'step-item cypress-step-item',
                                    {
                                      'is-active': currentPage.id === page.id,
                                      'is-completed': currentPageIndex > index,
                                      'is-error': hasErrors,
                                    },
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (page.id !== currentPage.id) {
                                      setPageId(page.id)
                                    }
                                  }}
                                >
                                  <div
                                    className="step-marker step-marker-error ob-step-marker cypress-step-marker"
                                    // @ts-expect-error ???
                                    name={`cypress-page-stepper-${index + 1}`}
                                    value={index + 1}
                                  >
                                    {hasErrors ? (
                                      <Tooltip title="Page has errors">
                                        <span className="icon tooltip has-tooltip-top cypress-page-error">
                                          <i className="material-icons has-text-danger is-size-3">
                                            warning
                                          </i>
                                        </span>
                                      </Tooltip>
                                    ) : (
                                      <span>{index + 1}</span>
                                    )}
                                  </div>
                                  <div className="step-details ob-step-details">
                                    <p className="step-title ob-step-title cypress-desktop-step-title">
                                      {page.label}
                                    </p>
                                  </div>
                                </div>
                              )
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={clsx('ob-steps-navigation__background', {
                      'is-active': isStepsHeaderActive,
                    })}
                    onClick={toggleStepsNavigation}
                  />

                  <div className="steps">
                    <div
                      className={clsx('steps-content', {
                        'is-single-step': !isShowingMultiplePages,
                      })}
                    >
                      <InjectPagesContext.Provider
                        value={handlePagesLookupResult}
                      >
                        <GoogleMapsApiKeyContext.Provider
                          value={googleMapsApiKey}
                        >
                          <AbnLookupAuthenticationGuidContext.Provider
                            value={abnLookupAuthenticationGuid}
                          >
                            <CaptchaSiteKeyContext.Provider
                              value={captchaSiteKey}
                            >
                              <AttachmentBlobsProvider>
                                <FormIsReadOnlyContext.Provider
                                  value={isReadOnly}
                                >
                                  <TaskContext.Provider
                                    value={taskContextValue}
                                  >
                                    {visiblePages.map(
                                      (pageElement: FormTypes.PageElement) => (
                                        <PageFormElements
                                          key={pageElement.id}
                                          isActive={
                                            pageElement.id === currentPage.id
                                          }
                                          formId={definition.id}
                                          formElementsConditionallyShown={
                                            formElementsConditionallyShown
                                          }
                                          formElementsValidation={
                                            formElementsValidation
                                          }
                                          displayValidationMessages={
                                            hasAttemptedSubmit ||
                                            isDisplayingCurrentPageError
                                          }
                                          pageElement={pageElement}
                                          onChange={handleChange}
                                          model={submission}
                                          setFormSubmission={setFormSubmission}
                                          onUploadAttachment={
                                            onUploadAttachment
                                          }
                                        />
                                      ),
                                    )}
                                  </TaskContext.Provider>
                                </FormIsReadOnlyContext.Provider>
                              </AttachmentBlobsProvider>
                            </CaptchaSiteKeyContext.Provider>
                          </AbnLookupAuthenticationGuidContext.Provider>
                        </GoogleMapsApiKeyContext.Provider>
                      </InjectPagesContext.Provider>
                    </div>

                    {isShowingMultiplePages && (
                      <div className="steps-actions">
                        <div className="steps-action">
                          <button
                            type="button"
                            onClick={goToPreviousPage}
                            disabled={isFirstVisiblePage}
                            className="button is-light cypress-pages-previous"
                          >
                            <span className="icon">
                              <i className="material-icons">
                                keyboard_arrow_left
                              </i>
                            </span>
                            <span>Back</span>
                          </button>
                        </div>
                        <div className="step-progress-mobile cypress-steps-mobile">
                          {visiblePages.map(
                            (page: FormTypes.PageElement, index) => (
                              <div
                                key={page.id}
                                className={clsx('step-progress-mobile-dot', {
                                  'is-active': currentPage.id === page.id,
                                  'is-completed': currentPageIndex > index,
                                  'has-background-danger':
                                    currentPage.id !== page.id &&
                                    checkDisplayPageError(page),
                                })}
                              />
                            ),
                          )}
                        </div>
                        <div className="steps-action">
                          <button
                            type="button"
                            onClick={goToNextPage}
                            disabled={isLastVisiblePage}
                            className="button is-light cypress-pages-next"
                          >
                            <span>Next</span>
                            <span className="icon">
                              <i className="material-icons">
                                keyboard_arrow_right
                              </i>
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isReadOnly && (
                    <div className="buttons ob-buttons ob-buttons-submit">
                      {onSaveDraft && !isInfoPage && (
                        <button
                          type="button"
                          className="button ob-button is-primary ob-button-save-draft cypress-save-draft-form"
                          onClick={() => handleSaveDraft(false)}
                          disabled={isPreview || disabled}
                        >
                          <CustomisableButtonInner
                            label={buttons?.saveDraft?.label || 'Save Draft'}
                            icon={buttons?.saveDraft?.icon}
                          />
                        </button>
                      )}
                      <span className="ob-buttons-submit__spacer"></span>
                      {!isInfoPage && (
                        <button
                          type="button"
                          className="button ob-button is-light ob-button-submit-cancel cypress-cancel-form"
                          onClick={handleCancel}
                          disabled={isPreview || disabled}
                        >
                          <CustomisableButtonInner
                            label={buttons?.cancel?.label || 'Cancel'}
                            icon={buttons?.cancel?.icon}
                          />
                        </button>
                      )}
                      {isLastVisiblePage && (
                        <button
                          type="submit"
                          className="button ob-button is-success ob-button-submit cypress-submit-form-button cypress-submit-form"
                          disabled={isPreview || disabled}
                        >
                          <CustomisableButtonInner
                            label={
                              isInfoPage
                                ? 'Done'
                                : buttons?.submit?.label || 'Submit'
                            }
                            icon={buttons?.submit?.icon}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </form>

              {!isReadOnly && !isPreview && (
                <React.Fragment>
                  <Prompt
                    when={isDirty && !isNavigationAllowed}
                    message={handleBlockedNavigation}
                  />
                  <Modal
                    isOpen={hasConfirmedNavigation === false}
                    title="Unsaved Changes"
                    cardClassName="cypress-cancel-confirm"
                    titleClassName="cypress-cancel-confirm-title"
                    bodyClassName="cypress-cancel-confirm-body"
                    actions={
                      <>
                        {onSaveDraft && (
                          <button
                            type="button"
                            className="button ob-button is-success cypress-cancel-confirm-save-draft"
                            onClick={() => handleSaveDraft(false)}
                          >
                            <CustomisableButtonInner
                              label={buttons?.saveDraft?.label || 'Save Draft'}
                              icon={buttons?.saveDraft?.icon}
                            />
                          </button>
                        )}
                        <span style={{ flex: 1 }}></span>
                        <button
                          type="button"
                          className="button ob-button is-light cypress-cancel-confirm-back"
                          onClick={handleKeepGoing}
                        >
                          <CustomisableButtonInner
                            label={buttons?.cancelPromptNo?.label || 'Back'}
                            icon={buttons?.cancelPromptNo?.icon}
                          />
                        </button>
                        <button
                          type="button"
                          className="button ob-button is-primary cypress-cancel-confirm-discard"
                          onClick={handleDiscardUnsavedChanges}
                        >
                          <CustomisableButtonInner
                            label={buttons?.cancelPromptYes?.label || 'Discard'}
                            icon={buttons?.cancelPromptYes?.icon}
                          />
                        </button>
                      </>
                    }
                  >
                    <p>
                      You have unsaved changes, are you sure you want discard
                      them?
                    </p>
                  </Modal>
                  <Modal
                    isOpen={promptUploadingAttachments === true}
                    title="Attachment upload in progress"
                    cardClassName="cypress-attachments-wait-continue"
                    titleClassName="cypress-attachments-confirm-wait-title"
                    bodyClassName="cypress-attachments-confirm-wait-body"
                    actions={
                      <>
                        <span style={{ flex: 1 }}></span>
                        <button
                          type="button"
                          className="button ob-button is-light cypress-attachments-confirm-wait"
                          onClick={handleWaitForAttachments}
                        >
                          Wait
                        </button>
                        <button
                          type="button"
                          className="button ob-button is-primary cypress-attachments-confirm-continue"
                          onClick={handleContinueWithAttachments}
                        >
                          Continue
                        </button>
                      </>
                    }
                  >
                    <p>
                      Your attachments are still uploading, do you want to wait
                      for the uploads to complete or continue using the app? If
                      you click continue the attachments will upload in the
                      background. Do not close the app until the upload has been
                      completed.
                    </p>
                  </Modal>

                  <Modal
                    isOpen={promptOfflineSubmissionAttempt}
                    title="It looks like you're Offline"
                    className="ob-modal__offline-submission-attempt"
                    cardClassName="cypress-submission-offline has-text-centered"
                    titleClassName="cypress-offline-title"
                    bodyClassName="cypress-offline-body"
                    actions={
                      <>
                        {onSaveDraft && (
                          <button
                            type="button"
                            className="button ob-button ob-button__offline-submission-attempt-save-draft is-success"
                            onClick={() => handleSaveDraft(false)}
                          >
                            <CustomisableButtonInner
                              label={buttons?.saveDraft?.label || 'Save Draft'}
                              icon={buttons?.saveDraft?.icon}
                            />
                          </button>
                        )}
                        <span style={{ flex: 1 }}></span>
                        <button
                          className="button ob-button ob-button__offline-submission-attempt-cancel is-light"
                          onClick={() =>
                            setPromptOfflineSubmissionAttempt(false)
                          }
                        >
                          Cancel
                        </button>
                        <button
                          className="button ob-button ob-button__offline-submission-attempt-try-again is-primary"
                          onClick={(e) => {
                            setPromptOfflineSubmissionAttempt(false)
                            handleSubmit(e, false)
                          }}
                        >
                          Try Again
                        </button>
                      </>
                    }
                  >
                    <p className="ob-modal__offline-submission-attempt-message">
                      You cannot submit this form while offline, please try
                      again when connectivity is restored.
                      {onSaveDraft && (
                        <span className="ob-modal__offline-submission-attempt-save-draft-message">
                          {' '}
                          Alternatively, click the{' '}
                          <b>
                            {buttons?.saveDraft?.label || 'Save Draft'}
                          </b>{' '}
                          button below to come back to this later.
                        </span>
                      )}
                    </p>
                    <i className="material-icons has-text-warning icon-x-large ob-modal__offline-submission-attempt-icon">
                      wifi_off
                    </i>
                  </Modal>
                </React.Fragment>
              )}
            </div>
          </FormElementLookupsContextProvider>
        </FormElementOptionsContextProvider>
      </FormDefinitionContext.Provider>
    </ThemeProvider>
  )
}

export default React.memo(OneBlinkFormBase)
