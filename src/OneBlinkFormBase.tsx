import * as React from 'react'
import { Tooltip } from '@material-ui/core'
import { Prompt, useHistory } from 'react-router-dom'
import clsx from 'clsx'
import _cloneDeep from 'lodash.clonedeep'
import * as bulmaToast from 'bulma-toast'

import useNullableState from './hooks/useNullableState'
import useBooleanState from './hooks/useBooleanState'
import Modal from './components/Modal'

import generateDefaultData from './services/generate-default-data'
import cleanFormElementsCtrlModel from './services/clean-form-elements-ctrl-model'
import OneBlinkFormElements from './components/OneBlinkFormElements'
import useFormValidation from './hooks/useFormValidation'
import useConditionalLogic from './hooks/useConditionalLogic'
import usePages from './hooks/usePages'
import useLookups from './hooks/useLookups'
import { ConditionallyShowOptionCallbackContext } from './hooks/useConditionallyShowOptionCallback'
import { FlattenElementsContext } from './hooks/useFlattenElementsContext'
import { FormDefinitionContext } from './hooks/useFormDefinition'
import { InjectPagesContext } from './hooks/useInjectPages'
import { ExecutedLookupProvider } from './hooks/useExecutedLookupCallback'
import useDynamicOptionsLoaderEffect from './hooks/useDynamicOptionsLoaderEffect'
import { GoogleMapsApiKeyContext } from './hooks/useGoogleMapsApiKey'
import { CaptchaSiteKeyContext } from './hooks/useCaptchaSiteKey'
import { FormIsReadOnlyContext } from './hooks/useFormIsReadOnly'
import useChangeEffect from './hooks/useChangeEffect'

import { FormTypes, SubmissionTypes } from '@oneblink/types'

type Props = {
  form: FormTypes.Form
  disabled?: boolean
  isPreview?: boolean
  initialSubmission?: FormElementsCtrl['model'] | null
  googleMapsApiKey?: string
  captchaSiteKey?: string
  isReadOnly?: boolean
  onCancel?: () => unknown
  onCloseConditionalLogicErrorModal: () => unknown
  onSubmit?: (newFormSubmission: SubmissionTypes.NewFormSubmission) => unknown
  onSaveDraft?: (
    newDraftSubmission: SubmissionTypes.NewDraftSubmission,
  ) => unknown
  onChange?: (model: FormElementsCtrl['model']) => unknown
}

function OneBlinkFormBase({
  googleMapsApiKey,
  captchaSiteKey,
  form: _form,
  disabled,
  isPreview,
  initialSubmission,
  isReadOnly = false,
  onCancel,
  onCloseConditionalLogicErrorModal,
  onSubmit,
  onSaveDraft,
  onChange,
}: Props) {
  //
  //
  // #region Form Definition

  const [definition, setDefinition] = React.useState<FormTypes.Form>(() =>
    _cloneDeep(_form),
  )
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

  const [{ submission, isDirty }, setFormSubmission] = React.useState(() => {
    const defaultData = generateDefaultData(
      definition.elements,
      initialSubmission || {},
    )
    return {
      isDirty: false,
      submission: defaultData,
    }
  })
  const setSubmission = React.useCallback((setter) => {
    return setFormSubmission((currentFormSubmission) => ({
      ...currentFormSubmission,
      submission: setter(currentFormSubmission.submission),
    }))
  }, [])

  // #endregion
  //
  //

  //
  //
  // #region Unsaved Changed

  const history = useHistory()

  const [isNavigationAllowed, allowNavigation] = useBooleanState(false)
  const [hasConfirmedNavigation, setHasConfirmedNavigation] = React.useState<
    boolean | null
  >(null)
  const [
    goToLocation,
    setGoToLocation,
    clearGoToLocation,
  ] = useNullableState<Location>(null)

  const handleBlockedNavigation = React.useCallback(
    (location) => {
      setGoToLocation(location)
      setHasConfirmedNavigation(false)
      return false
    },
    [setGoToLocation],
  )

  const handleKeepGoing = React.useCallback(() => {
    setHasConfirmedNavigation(null)
    clearGoToLocation()
  }, [clearGoToLocation])

  const handleDiscardUnsavedChanges = React.useCallback(() => {
    setHasConfirmedNavigation(true)
    allowNavigation()
  }, [allowNavigation])

  React.useEffect(() => {
    if (hasConfirmedNavigation) {
      // Navigate to the previous blocked location with your navigate function
      if (goToLocation) {
        history.push(`${goToLocation.pathname}${goToLocation.search}`)
      } else if (onCancel) {
        onCancel()
      }
    }
  }, [goToLocation, hasConfirmedNavigation, history, onCancel])

  const handleCancel = React.useCallback(() => {
    if (isDirty) {
      setHasConfirmedNavigation(false)
    } else if (onCancel) {
      onCancel()
    }
  }, [isDirty, onCancel])

  // #endregion Unsaved Changed
  //
  //

  //
  //
  // #region Conditional Logic

  const {
    rootFormElementsCtrl,
    pageElementsConditionallyShown,
    rootElementsConditionallyShown,
    handleConditionallyShowOption,
    conditionalLogicState,
    elementsOnPages,
  } = useConditionalLogic({ submission, pages })

  // #endregion
  //
  //

  //
  //
  // #region Validation

  const { validate, executedLookup, executeLookupFailed } = useFormValidation(
    pages,
  )

  const pagesValidation = React.useMemo<PageElementsValidation | undefined>(
    () => validate(submission, pageElementsConditionallyShown).pagesValidation,
    [pageElementsConditionallyShown, submission, validate],
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
    pagesValidation,
    pageElementsConditionallyShown,
  })

  // #endregion
  //
  //

  //
  //
  // #region Dynamic Options

  useDynamicOptionsLoaderEffect(definition, setDefinition)

  // #endregion
  //
  //

  //
  //
  // #region Submissions

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false)
  const getCurrentSubmissionData = React.useCallback(
    (stripBinaryData) => {
      // Clear data from submission on fields that are hidden on visible pages
      return visiblePages.reduce(
        (
          cleanSubmissionData: {
            submission: FormElementsCtrl['model']
            captchaTokens: string[]
          },
          pageElement: FormTypes.PageElement,
        ) => {
          const { model, captchaTokens } = cleanFormElementsCtrlModel(
            {
              elements: pageElement.elements,
              model: submission,
              parentFormElementsCtrl: rootFormElementsCtrl,
            },
            rootElementsConditionallyShown,
            stripBinaryData,
          )
          return {
            submission: {
              ...cleanSubmissionData.submission,
              ...model,
            },
            captchaTokens: [
              ...cleanSubmissionData.captchaTokens,
              ...captchaTokens,
            ],
          }
        },
        { submission: {}, captchaTokens: [] },
      )
    },
    [
      rootElementsConditionallyShown,
      rootFormElementsCtrl,
      submission,
      visiblePages,
    ],
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

  const handleSubmit = React.useCallback(
    (event) => {
      event.preventDefault()
      if (disabled || isReadOnly) return
      if (onSubmit) {
        setHasAttemptedSubmit(true)

        if (pagesValidation) {
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

        const submissionData = getCurrentSubmissionData(false)

        allowNavigation()

        onSubmit({
          definition,
          submission: submissionData.submission,
          captchaTokens: submissionData.captchaTokens,
        })
      }
    },
    [
      allowNavigation,
      definition,
      disabled,
      getCurrentSubmissionData,
      onSubmit,
      pagesValidation,
      isReadOnly,
    ],
  )

  const handleSaveDraft = React.useCallback(() => {
    if (disabled) return
    if (onSaveDraft) {
      allowNavigation()

      // For drafts we don't need to save the captcha tokens,
      // they will need to prove they are not robot again
      const { submission } = getCurrentSubmissionData(false)

      onSaveDraft({
        definition,
        submission,
      })
    }
  }, [
    allowNavigation,
    definition,
    disabled,
    getCurrentSubmissionData,
    onSaveDraft,
  ])

  // #endregion
  //
  //

  //
  //
  // #region Lookups

  const {
    injectPagesAfter,
    handleChangeElements,
    handleChangeModel,
  } = useLookups({
    formId: definition.id,
    currentPageId: currentPage.id,
    setDefinition,
    setSubmission,
  })

  // #endregion
  //
  //

  //
  //
  // #region Submission/Definition Changes

  const handleChange = React.useCallback(
    (element: FormTypes.FormElement, value: unknown | undefined): void => {
      if (disabled) return
      if (element.type !== 'page') {
        setFormSubmission((currentFormSubmission) => ({
          isDirty: true,
          submission: {
            ...currentFormSubmission.submission,
            [element.name]: value,
          },
        }))
      }
    },
    [disabled],
  )

  useChangeEffect(() => {
    if (onChange) {
      onChange(submission)
    }
  }, [onChange, submission])

  // #endregion
  //
  //

  if (conditionalLogicState) {
    return (
      <Modal
        isOpen
        title="Bad Form Configuration"
        actions={
          <button
            type="button"
            className="button ob-button is-primary"
            onClick={onCloseConditionalLogicErrorModal}
          >
            Okay
          </button>
        }
      >
        <div className="content">
          {conditionalLogicState.message}
          <ul className="cypress-error-modal-elements-evaluated">
            {conditionalLogicState.elements.map(
              (elementName: string, index: number) => (
                <li key={index}>{elementName}</li>
              ),
            )}
          </ul>
        </div>
      </Modal>
    )
  }

  return (
    <div className="ob-form-container" ref={obFormContainerHTMLElementRef}>
      <form
        name="obForm"
        className={`ob-form cypress-ob-form ob-form__page-${
          currentPageIndex + 1
        }`}
        noValidate
        onSubmit={handleSubmit}
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
              <ConditionallyShowOptionCallbackContext.Provider
                value={handleConditionallyShowOption}
              >
                <FlattenElementsContext.Provider value={elementsOnPages}>
                  <FormDefinitionContext.Provider value={definition}>
                    <InjectPagesContext.Provider value={injectPagesAfter}>
                      <ExecutedLookupProvider
                        executedLookup={executedLookup}
                        executeLookupFailed={executeLookupFailed}
                      >
                        <GoogleMapsApiKeyContext.Provider
                          value={googleMapsApiKey}
                        >
                          <CaptchaSiteKeyContext.Provider
                            value={captchaSiteKey}
                          >
                            <FormIsReadOnlyContext.Provider value={isReadOnly}>
                              {visiblePages.map(
                                (page: FormTypes.PageElement) => (
                                  <div
                                    key={page.id}
                                    className={clsx(
                                      'ob-page step-content is-active cypress-page',
                                      {
                                        'is-invisible':
                                          currentPage.id !== page.id,
                                      },
                                    )}
                                  >
                                    <OneBlinkFormElements
                                      formId={definition.id}
                                      formElementsConditionallyShown={
                                        rootElementsConditionallyShown
                                      }
                                      formElementsValidation={
                                        pagesValidation &&
                                        pagesValidation[page.id]
                                      }
                                      displayValidationMessages={
                                        hasAttemptedSubmit ||
                                        checkDisplayPageError(page)
                                      }
                                      elements={page.elements}
                                      onChange={handleChange}
                                      onChangeElements={handleChangeElements}
                                      onChangeModel={handleChangeModel}
                                      formElementsCtrl={rootFormElementsCtrl}
                                      idPrefix=""
                                    />
                                  </div>
                                ),
                              )}
                            </FormIsReadOnlyContext.Provider>
                          </CaptchaSiteKeyContext.Provider>
                        </GoogleMapsApiKeyContext.Provider>
                      </ExecutedLookupProvider>
                    </InjectPagesContext.Provider>
                  </FormDefinitionContext.Provider>
                </FlattenElementsContext.Provider>
              </ConditionallyShowOptionCallbackContext.Provider>
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
                  {visiblePages.map((page: FormTypes.PageElement) => (
                    <div
                      key={page.id}
                      className={clsx('step-progress-mobile-dot', {
                        'is-active': currentPage.id === page.id,
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
              {onSaveDraft && !definition.isInfoPage && (
                <button
                  type="button"
                  className="button ob-button is-primary ob-button-save-draft cypress-save-draft-form"
                  onClick={handleSaveDraft}
                  disabled={isPreview || disabled}
                >
                  <span>Save Draft</span>
                </button>
              )}
              <span className="ob-buttons-submit__spacer"></span>
              {!definition.isInfoPage && (
                <button
                  type="button"
                  className="button ob-button is-light ob-button-submit-cancel cypress-cancel-form"
                  onClick={handleCancel}
                  disabled={isPreview || disabled}
                >
                  <span>Cancel</span>
                </button>
              )}
              {isLastVisiblePage && (
                <button
                  type="submit"
                  className="button ob-button is-success ob-button-submit cypress-submit-form-button cypress-submit-form"
                  disabled={isPreview || disabled}
                >
                  <span>{definition.isInfoPage ? 'Done' : 'Submit'}</span>
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
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </button>
                )}
                <span style={{ flex: 1 }}></span>
                <button
                  type="button"
                  className="button ob-button is-light cypress-cancel-confirm-back"
                  onClick={handleKeepGoing}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="button ob-button is-primary cypress-cancel-confirm-discard"
                  onClick={handleDiscardUnsavedChanges}
                >
                  Discard
                </button>
              </>
            }
          >
            <p>You have unsaved changes, are you sure you want discard them?</p>
          </Modal>
        </React.Fragment>
      )}
    </div>
  )
}

export default React.memo(OneBlinkFormBase)
