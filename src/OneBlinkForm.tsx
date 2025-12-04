import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import OneBlinkFormBase, {
  OneBlinkFormBaseProps,
  OneBlinkFormControlledProps,
  OneBlinkFormUncontrolledProps,
} from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'
import useFormSubmissionDuration from './hooks/useFormSubmissionDuration'
import { SectionState } from './types/form'

export { OneBlinkFormBaseProps, OneBlinkFormControlledProps }

/**
 * Similar to {@link OneBlinkForm}, however requires props to control the
 * `definition` and `submission` values.
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import { FormTypes } from '@oneblink/types'
 * import {
 *   OneBlinkAppsError,
 *   draftService,
 *   submissionService,
 * } from '@oneblink/apps'
 * import {
 *   IsOfflineContextProvider,
 *   OneBlinkFormControlled,
 *   useIsMounted,
 *   useFormSubmissionState,
 * } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 *
 * const captchaSiteKey = 'ENTER_YOUR_SITE_KEY_HERE'
 * const googleMapsApiKey = 'ENTER_YOUR_MAPS_API_KEY_HERE'
 * const formsAppId = 1
 * const form: FormTypes.Form = {
 *   id: 1,
 *   name: 'Name of Form',
 *   description: '',
 *   organisationId: 'abc123',
 *   formsAppEnvironmentId: 1,
 *   formsAppIds: [],
 *   elements: [],
 *   isAuthenticated: false,
 *   isMultiPage: false,
 *   isInfoPage: false,
 *   publishStartDate: null,
 *   publishEndDate: null,
 *   postSubmissionAction: 'FORMS_LIBRARY',
 *   submissionEvents: [],
 *   tags: [],
 * }
 * const initialSubmission: Record<string, unknown> = {
 *   data: 1,
 * }
 *
 * function FormContainer() {
 *   const isMounted = useIsMounted()
 *
 *   const [{ definition, submission }, setFormSubmission] =
 *     useFormSubmissionState(form, initialSubmission)
 *
 *   const [{ isSavingDraft, saveDraftError }, setSaveDraftState] =
 *     React.useState({
 *       isSavingDraft: false,
 *       saveDraftError: null,
 *     })
 *
 *   const [
 *     { isSubmitting, submitError, formSubmissionResult },
 *     setSubmitState,
 *   ] = React.useState({
 *     formSubmissionResult: null,
 *     isSubmitting: false,
 *     submitError: null,
 *   })
 *
 *   const handleSubmit = React.useCallback(
 *     async (newFormSubmission: FormTypes.NewFormSubmission) => {
 *       const formSubmission: FormSubmission = Object.assign(
 *         {},
 *         newFormSubmission,
 *         {
 *           formsAppId,
 *           jobId: null,
 *           externalId: null,
 *           draftId: null,
 *           preFillFormDataId: null,
 *         },
 *       )
 *
 *       setSubmitState({
 *         formSubmissionResult: null,
 *         submitError: null,
 *         isSubmitting: true,
 *       })
 *
 *       try {
 *         const newFormSubmissionResult = await submissionService.submit({
 *           formSubmission,
 *         })
 *         if (
 *           newFormSubmissionResult.isOffline &&
 *           !newFormSubmissionResult.isInPendingQueue
 *         ) {
 *           throw new OneBlinkAppsError(
 *             'You cannot submit this form while offline, please try again when connectivity is restored.',
 *             {
 *               isOffline: true,
 *             },
 *           )
 *         }
 *
 *         if (isMounted.current) {
 *           setSubmitState({
 *             formSubmissionResult: newFormSubmissionResult,
 *             isSubmitting: false,
 *             submitError: null,
 *           })
 *         }
 *       } catch (error) {
 *         if (isMounted.current) {
 *           setSubmitState({
 *             formSubmissionResult: null,
 *             isSubmitting: false,
 *             submitError: error,
 *           })
 *         }
 *       }
 *     },
 *     [isMounted],
 *   )
 *
 *   const handleSaveDraft = React.useCallback(
 *     async (newDraftSubmission: FormTypes.NewDraftSubmission) => {
 *       const draftSubmission: FormTypes.DraftSubmission = {
 *         ...newDraftSubmission,
 *         formsAppId,
 *       }
 *       setSaveDraftState({
 *         saveDraftError: null,
 *         isSavingDraft: true,
 *       })
 *
 *       try {
 *         await draftService.addDraft(
 *           {
 *             title: form.name,
 *             formId: form.id,
 *             externalId: null,
 *             jobId: null,
 *           },
 *           draftSubmission,
 *         )
 *
 *         if (isMounted.current) {
 *           setSaveDraftState({
 *             saveDraftError: null,
 *             isSavingDraft: false,
 *           })
 *         }
 *       } catch (error) {
 *         if (isMounted.current) {
 *           setSaveDraftState({
 *             saveDraftError: error,
 *             isSavingDraft: false,
 *           })
 *         }
 *       }
 *     },
 *     [isMounted],
 *   )
 *
 *   const handleCancel = React.useCallback(() => {
 *     // handle cancel here...
 *   }, [])
 *
 *   if (isSubmitting) {
 *     // Render submitting animation/loading
 *   }
 *
 *   if (submitError) {
 *     // Render error while submitting
 *   }
 *
 *   if (isSavingDraft) {
 *     // Render saving draft animation/loading
 *   }
 *
 *   if (saveDraftError) {
 *     // Render error while saving draft
 *   }
 *
 *   if (formSubmissionResult) {
 *     // Render submission success
 *   }
 *
 *   return (
 *     <OneBlinkFormControlled
 *       captchaSiteKey={captchaSiteKey}
 *       googleMapsApiKey={googleMapsApiKey}
 *       formsAppId={formsAppId}
 *       definition={definition}
 *       submission={submission}
 *       setFormSubmission={setFormSubmission}
 *       onCancel={handleCancel}
 *       onSubmit={handleSubmit}
 *       onSaveDraft={handleSaveDraft}
 *     />
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <IsOfflineContextProvider>
 *       <FormContainer />
 *     </IsOfflineContextProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * #### Implementing Controlled Auto Save
 *
 * The {@link OneBlinkAutoSaveForm} component does not offer props to allow for a
 * controlled form (i.e. having access to `submission` and `definition` values).
 * To implement a controlled version of the `<OneBlinkAutoSaveForm />`
 * component, use the example component below.
 *
 * ```tsx
 * import * as React from 'react'
 * import {
 *   OneBlinkAutoSaveForm,
 *   OneBlinkFormControlled,
 *   useFormSubmissionAutoSaveState,
 * } from '@oneblink/apps-react'
 *
 * function OneBlinkAutoSaveFormControlled({
 *   form,
 *   initialSubmission,
 *   autoSaveKey,
 *   onCancel,
 *   onSubmit,
 *   onSaveDraft,
 *   ...props
 * }: React.ComponentProps<typeof OneBlinkAutoSaveForm>) {
 *   const {
 *     definition,
 *     submission,
 *     isLoadingAutoSaveSubmission,
 *     isAutoSaveSubmissionAvailable,
 *     startNewSubmission,
 *     continueAutoSaveSubmission,
 *     handleSubmit,
 *     handleCancel,
 *     handleSaveDraft,
 *     setFormSubmission,
 *   } = useFormSubmissionAutoSaveState({
 *     form,
 *     initialSubmission,
 *     autoSaveKey,
 *     onCancel,
 *     onSubmit,
 *     onSaveDraft,
 *   })
 *
 *   // This is just an example of how you could intercept
 *   // the change event when a user enters/selects a value
 *   // on the form.
 *   const customSetFormSubmission = React.useCallback(
 *     (formSubmission) => {
 *       setFormSubmission((currentFormSubmission) => {
 *         const newFormSubmission =
 *           typeof formSubmission === 'function'
 *             ? formSubmission(currentFormSubmission)
 *             : formSubmission
 *
 *         // This is where you can access the updated
 *         // submission data or form definition.
 *         // You could even change the form definition
 *         // programmatically based on user inputs.
 *         console.log(
 *           'A change has occurred to the submission',
 *           newFormSubmission.submission,
 *         )
 *         newFormSubmission.definition.isInfoPage =
 *           !newFormSubmission.submission.doesTheUserNeedToSubmit
 *
 *         return newFormSubmission
 *       })
 *     },
 *     [setFormSubmission],
 *   )
 *
 *   if (isLoadingAutoSaveSubmission) {
 *     return <p>Checking for auto save data...</p>
 *   }
 *
 *   if (isAutoSaveSubmissionAvailable) {
 *     return (
 *       <>
 *         <p>Do you want to use the auto save data?</p>
 *         <button onClick={startNewSubmission}>No, start again</button>
 *         <button onClick={continueAutoSaveSubmission}>
 *           Yes, continue
 *         </button>
 *       </>
 *     )
 *   }
 *
 *   return (
 *     <OneBlinkFormControlled
 *       {...props}
 *       submission={submission}
 *       definition={definition}
 *       onCancel={handleCancel}
 *       onSubmit={handleSubmit}
 *       onSaveDraft={handleSaveDraft}
 *       setFormSubmission={customSetFormSubmission}
 *     />
 *   )
 * }
 *
 * export default React.memo(OneBlinkAutoSaveFormControlled)
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
const OneBlinkFormControlled = React.memo(function OneBlinkFormControlled(
  props: OneBlinkFormBaseProps & OneBlinkFormControlledProps,
) {
  return <OneBlinkFormBase {...props} isReadOnly={false} />
})

/**
 * Component for rendering a OneBlink Form. This component will render the
 * submit, cancel and save draft buttons but it is up to the developer to
 * implement what happens when those buttons are clicked.
 *
 * It is also recommended to import the `css` from this library as well.
 *
 * ```js
 * import { OneBlinkForm } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 * ```
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import { FormTypes } from '@oneblink/types'
 * import {
 *   OneBlinkAppsError,
 *   draftService,
 *   submissionService,
 * } from '@oneblink/apps'
 * import {
 *   IsOfflineContextProvider,
 *   OneBlinkForm,
 *   useIsMounted,
 * } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 *
 * const captchaSiteKey = 'ENTER_YOUR_SITE_KEY_HERE'
 * const googleMapsApiKey = 'ENTER_YOUR_MAPS_API_KEY_HERE'
 * const formsAppId = 1
 * const form: FormTypes.Form = {
 *   id: 1,
 *   name: 'Name of Form',
 *   description: '',
 *   organisationId: 'abc123',
 *   formsAppEnvironmentId: 1,
 *   formsAppIds: [],
 *   elements: [],
 *   isAuthenticated: false,
 *   isMultiPage: false,
 *   isInfoPage: false,
 *   publishStartDate: null,
 *   publishEndDate: null,
 *   postSubmissionAction: 'FORMS_LIBRARY',
 *   submissionEvents: [],
 *   tags: [],
 * }
 *
 * function FormContainer() {
 *   const isMounted = useIsMounted()
 *
 *   const [{ isSavingDraft, saveDraftError }, setSaveDraftState] =
 *     React.useState({
 *       isSavingDraft: false,
 *       saveDraftError: null,
 *     })
 *
 *   const [
 *     { isSubmitting, submitError, formSubmissionResult },
 *     setSubmitState,
 *   ] = React.useState({
 *     formSubmissionResult: null,
 *     isSubmitting: false,
 *     submitError: null,
 *   })
 *
 *   const handleSubmit = React.useCallback(
 *     async (newFormSubmission: FormTypes.NewFormSubmission) => {
 *       const formSubmission: FormSubmission = Object.assign(
 *         {},
 *         newFormSubmission,
 *         {
 *           formsAppId,
 *           jobId: null,
 *           externalId: null,
 *           draftId: null,
 *           preFillFormDataId: null,
 *         },
 *       )
 *
 *       setSubmitState({
 *         formSubmissionResult: null,
 *         submitError: null,
 *         isSubmitting: true,
 *       })
 *
 *       try {
 *         const newFormSubmissionResult = await submissionService.submit({
 *           formSubmission,
 *         })
 *         if (
 *           newFormSubmissionResult.isOffline &&
 *           !newFormSubmissionResult.isInPendingQueue
 *         ) {
 *           throw new OneBlinkAppsError(
 *             'You cannot submit this form while offline, please try again when connectivity is restored.',
 *             {
 *               isOffline: true,
 *             },
 *           )
 *         }
 *
 *         if (isMounted.current) {
 *           setSubmitState({
 *             formSubmissionResult: newFormSubmissionResult,
 *             isSubmitting: false,
 *             submitError: null,
 *           })
 *         }
 *       } catch (error) {
 *         if (isMounted.current) {
 *           setSubmitState({
 *             formSubmissionResult: null,
 *             isSubmitting: false,
 *             submitError: error,
 *           })
 *         }
 *       }
 *     },
 *     [isMounted],
 *   )
 *
 *   const handleSaveDraft = React.useCallback(
 *     async (newDraftSubmission: FormTypes.NewDraftSubmission) => {
 *       const draftSubmission: FormTypes.DraftSubmission = {
 *         ...newDraftSubmission,
 *         formsAppId,
 *       }
 *       setSaveDraftState({
 *         saveDraftError: null,
 *         isSavingDraft: true,
 *       })
 *
 *       try {
 *         await draftService.addDraft(
 *           {
 *             title: form.name,
 *             formId: form.id,
 *             externalId: null,
 *             jobId: null,
 *           },
 *           draftSubmission,
 *         )
 *
 *         if (isMounted.current) {
 *           setSaveDraftState({
 *             saveDraftError: null,
 *             isSavingDraft: false,
 *           })
 *         }
 *       } catch (error) {
 *         if (isMounted.current) {
 *           setSaveDraftState({
 *             saveDraftError: error,
 *             isSavingDraft: false,
 *           })
 *         }
 *       }
 *     },
 *     [isMounted],
 *   )
 *
 *   const handleCancel = React.useCallback(() => {
 *     // handle cancel here...
 *   }, [isMounted])
 *
 *   if (isSubmitting) {
 *     // Render submitting animation/loading
 *   }
 *
 *   if (submitError) {
 *     // Render error while submitting
 *   }
 *
 *   if (isSavingDraft) {
 *     // Render saving draft animation/loading
 *   }
 *
 *   if (saveDraftError) {
 *     // Render error while saving draft
 *   }
 *
 *   if (formSubmissionResult) {
 *     // Render submission success
 *   }
 *
 *   return (
 *     <OneBlinkForm
 *       captchaSiteKey={captchaSiteKey}
 *       googleMapsApiKey={googleMapsApiKey}
 *       formsAppId={formsAppId}
 *       form={form}
 *       onCancel={handleCancel}
 *       onSubmit={handleSubmit}
 *       onSaveDraft={handleSaveDraft}
 *       attachmentRetentionInDays={1}
 *     />
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <IsOfflineContextProvider>
 *       <FormContainer />
 *     </IsOfflineContextProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
const OneBlinkFormUncontrolled = React.memo(function OneBlinkFormUncontrolled({
  form,
  initialSubmission,
  resumeAtElement,
  resumeSectionState,
  resumePreviousElapsedDurationSeconds,
  ...props
}: OneBlinkFormBaseProps &
  OneBlinkFormUncontrolledProps & {
    /** The element to resume the form at. */
    resumeAtElement?: FormTypes.FormElement
    resumeSectionState?: SectionState
    resumePreviousElapsedDurationSeconds?: number
  }) {
  const [getCurrentSubmissionDuration] = useFormSubmissionDuration(
    resumePreviousElapsedDurationSeconds,
  )
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
  return (
    <OneBlinkFormBase
      {...props}
      isReadOnly={false}
      definition={definition}
      submission={submission}
      setFormSubmission={setFormSubmission}
      lastElementUpdated={lastElementUpdated}
      executedLookups={executedLookups}
      sectionState={sectionState}
      getCurrentSubmissionDuration={getCurrentSubmissionDuration}
    />
  )
})

export { OneBlinkFormControlled, OneBlinkFormUncontrolled }
