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
import { FormTypes, FormsAppsTypes } from '@oneblink/types'
import { attachmentsService } from '@oneblink/apps'

import Modal from './components/renderer/Modal'
import OneBlinkAppsErrorOriginalMessage from './components/renderer/OneBlinkAppsErrorOriginalMessage'
import cleanFormSubmissionModel from './services/cleanFormSubmissionModel'
import PageFormElements from './components/renderer/PageFormElements'
import useFormValidation from './hooks/useFormValidation'
import useConditionalLogic from './hooks/useConditionalLogic'
import usePages from './hooks/usePages'
import useLookups from './hooks/useLookups'
import { FormDefinitionContext } from './hooks/useFormDefinition'
import { InjectPagesContext } from './hooks/useInjectPages'
import { ExecutedLookupProvider } from './hooks/useExecutedLookupCallback'
import useDynamicOptionsLoaderState from './hooks/useDynamicOptionsLoaderState'
import { GoogleMapsApiKeyContext } from './hooks/useGoogleMapsApiKey'
import { AbnLookupAuthenticationGuidContext } from './hooks/useAbnLookupAuthenticationGuid'
import { CaptchaSiteKeyContext } from './hooks/useCaptchaSiteKey'
import { FormIsReadOnlyContext } from './hooks/useFormIsReadOnly'
import { AttachmentBlobsProvider } from './hooks/attachments/useAttachmentBlobs'
import useIsOffline from './hooks/useIsOffline'
import CustomisableButtonInner from './components/renderer/CustomisableButtonInner'
import {
  FormElementsValidation,
  FormElementValueChangeHandler,
  FormSubmissionModel,
  SetFormSubmission,
} from './types/form'
import checkBsbsAreInvalid from './services/checkBsbsAreInvalid'
import checkIfBsbsAreValidating from './services/checkIfBsbsAreValidating'
import checkIfAttachmentsExist from './services/checkIfAttachmentsExist'
import useAuth from './hooks/useAuth'
import determineIsInfoPage from './services/determineIsInfoPage'

export type BaseProps = {
  onCancel: () => unknown
  onSubmit: (newFormSubmission: submissionService.NewFormSubmission) => unknown
  disabled?: boolean
  isPreview?: boolean
  googleMapsApiKey?: string
  abnLookupAuthenticationGuid?: string
  captchaSiteKey?: string
  buttons?: FormsAppsTypes.FormsListStyles['buttons']
  primaryColour?: string
  attachmentRetentionInDays?: number
  allowSubmitWithPendingAttachments?: boolean
  onSaveDraft?: (
    newDraftSubmission: submissionService.NewDraftSubmission,
  ) => unknown
  handleNavigateAway?: () => unknown
  isInfoPage?: 'YES' | 'NO' | 'CALCULATED'
}

export type ControlledProps = {
  definition: FormTypes.Form
  submission: FormSubmissionModel
  setFormSubmission: SetFormSubmission
}

type Props = BaseProps &
  ControlledProps & {
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
  allowSubmitWithPendingAttachments,
  handleNavigateAway,
  isInfoPage: isInfoPageProp,
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
    return determineIsInfoPage(definition)
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
    goToLocation: Location | null
  }>({
    isDirty: false,
    isNavigationAllowed: false,
    hasConfirmedNavigation: null,
    goToLocation: null,
  })
  const [promptUploadingAttachments, setPromptUploadingAttachments] =
    React.useState<boolean>(false)
  const handleBlockedNavigation = React.useCallback((location) => {
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

  const { validate, executedLookup, executeLookupFailed } =
    useFormValidation(pages)

  const formElementsValidation = React.useMemo<
    FormElementsValidation | undefined
  >(
    () =>
      !isReadOnly
        ? validate(submission, formElementsConditionallyShown)
        : undefined,
    [formElementsConditionallyShown, isReadOnly, submission, validate],
  )

  // #endregion
  //
  //

  //
  //
  // #region Pages

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
    pages,
    formElementsValidation,
    formElementsConditionallyShown,
  })

  // #endregion
  //
  //

  //
  //
  // #region Dynamic Options

  const loadDynamicOptionsState = useDynamicOptionsLoaderState(
    definition,
    setFormSubmission,
  )

  // #endregion
  //
  //

  //
  //
  // #region Submissions

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false)
  const getCurrentSubmissionData = React.useCallback(
    (stripBinaryData) => {
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
    (submission: FormSubmissionModel) => {
      // Prevent submission until all attachment uploads are finished
      // Unless the user is offline, in which case, the uploads will
      // be taken care of by a pending queue...hopefully.
      if (isOffline) {
        return true
      }
      const attachmentsAreUploading =
        attachmentsService.checkIfAttachmentsAreUploading(
          definition,
          submission,
        )

      if (attachmentsAreUploading) {
        if (isUsingFormsKey || !allowSubmitWithPendingAttachments) {
          bulmaToast.toast({
            message:
              'Attachments are still uploading, please wait for them to finish before trying again.',
            // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
            type: 'ob-toast is-primary cypress-still-uploading-toast',
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
    [definition, isOffline, isUsingFormsKey, allowSubmitWithPendingAttachments],
  )

  const checkBsbsCanBeSubmitted = React.useCallback(
    (submission: FormSubmissionModel) => {
      return !checkBsbsAreInvalid(definition, submission)
    },
    [definition],
  )

  const checkBsbAreValidating = React.useCallback(
    (submission: FormSubmissionModel) => {
      if (checkIfBsbsAreValidating(definition, submission)) {
        bulmaToast.toast({
          message:
            'Bsb(s) are still being validated, please wait for them to finish before trying again.',
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: 'ob-toast is-primary cypress-still-validating-toast',
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
    (event, continueWhilstAttachmentsAreUploading) => {
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
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: 'ob-toast is-danger cypress-invalid-submit-attempt',
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return
      }
      if (!checkBsbsCanBeSubmitted(submissionData.submission)) {
        return
      }
      if (!continueWhilstAttachmentsAreUploading) {
        if (!checkAttachmentsCanBeSubmitted(submissionData.submission)) {
          return
        }
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
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: 'ob-toast is-danger cypress-invalid-submit-attempt',
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
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
      checkAttachmentsCanBeSubmitted,
      checkBsbsCanBeSubmitted,
      definition,
      attachmentRetentionInDays,
      allowNavigation,
      onSubmit,
      setFormSubmission,
    ],
  )

  const handleSaveDraft = React.useCallback(
    (continueWhilstAttachmentsAreUploading) => {
      if (disabled) return
      if (onSaveDraft) {
        allowNavigation()

        // For drafts we don't need to save the captcha tokens,
        // they will need to prove they are not robot again
        const { submission } = getCurrentSubmissionData(false)
        if (!checkBsbAreValidating(submission)) {
          return
        }
        if (!continueWhilstAttachmentsAreUploading) {
          if (!checkAttachmentsCanBeSubmitted(submission)) {
            return
          }
        }
        onSaveDraft({
          definition,
          submission,
          backgroundUpload: continueWhilstAttachmentsAreUploading,
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
    ],
  )

  const handleContinueWithAttachments = React.useCallback(
    (e) => {
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

  const handleChange = React.useCallback<FormElementValueChangeHandler>(
    (element, value) => {
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
    },
    [disabled, setFormSubmission],
  )

  // #endregion
  //
  //

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

  if (loadDynamicOptionsState) {
    return (
      <>
        <div className="has-text-centered">
          <i className="material-icons has-text-warning icon-x-large">error</i>
          <h3 className="title is-3">{loadDynamicOptionsState.error.title}</h3>
          <p>{loadDynamicOptionsState.error.message}</p>
          <p className="has-text-grey">
            {localisationService.formatDatetimeLong(new Date())}
          </p>
        </div>

        <OneBlinkAppsErrorOriginalMessage
          error={loadDynamicOptionsState.error.originalError}
        />
      </>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="ob-form-container" ref={obFormContainerHTMLElementRef}>
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
                            className={clsx('step-item cypress-step-item', {
                              'is-active': currentPage.id === page.id,
                              'is-completed': currentPageIndex > index,
                              'is-error': hasErrors,
                            })}
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
                <FormDefinitionContext.Provider value={definition}>
                  <InjectPagesContext.Provider value={handlePagesLookupResult}>
                    <ExecutedLookupProvider
                      executedLookup={executedLookup}
                      executeLookupFailed={executeLookupFailed}
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
                                    />
                                  ),
                                )}
                              </FormIsReadOnlyContext.Provider>
                            </AttachmentBlobsProvider>
                          </CaptchaSiteKeyContext.Provider>
                        </AbnLookupAuthenticationGuidContext.Provider>
                      </GoogleMapsApiKeyContext.Provider>
                    </ExecutedLookupProvider>
                  </InjectPagesContext.Provider>
                </FormDefinitionContext.Provider>
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
                        <i className="material-icons">keyboard_arrow_left</i>
                      </span>
                      <span>Back</span>
                    </button>
                  </div>
                  <div className="step-progress-mobile cypress-steps-mobile">
                    {visiblePages.map((page: FormTypes.PageElement, index) => (
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
                    ))}
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
                        <i className="material-icons">keyboard_arrow_right</i>
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
                        isInfoPage ? 'Done' : buttons?.submit?.label || 'Submit'
                      }
                      icon={buttons?.submit?.icon}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        {!isReadOnly && (
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
                You have unsaved changes, are you sure you want discard them?
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
                Your attachments are still uploading, do you want to wait for
                the uploads to complete or continue using the app? If you click
                continue the attachments will upload in the background. Do not
                close the app until the upload has been completed.
              </p>
            </Modal>
          </React.Fragment>
        )}
      </div>
    </ThemeProvider>
  )
}

export default React.memo(OneBlinkFormBase)
