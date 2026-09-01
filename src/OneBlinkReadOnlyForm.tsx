import * as React from 'react'
import OneBlinkFormBase, {
  OneBlinkFormUncontrolledProps,
  OneBlinkReadOnlyFormProps,
} from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'

function OneBlinkReadOnlyForm({
  form,
  initialSubmission,
  ...rest
}: OneBlinkReadOnlyFormProps & OneBlinkFormUncontrolledProps) {
  const [{ submission, definition, executedLookups }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const noop = React.useCallback(() => {}, [])

  return (
    <OneBlinkFormBase
      definition={definition}
      submission={submission}
      disabled={true}
      isReadOnly={true}
      onCancel={noop}
      onSubmit={noop}
      setFormSubmission={setFormSubmission}
      isPendingQueueEnabled={false}
      executedLookups={executedLookups}
      sectionState={[]}
      {...rest}
    />
  )
}

/**
 * Component for rendering a OneBlink Form in read-only mode. This component
 * will render the form with all inputs disabled but will **not** render the
 * submit, cancel and save draft buttons.
 *
 * It is also recommended to import the `css` from this library as well.
 *
 * ```js
 * import { OneBlinkReadOnlyForm } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 * ```
 *
 * #### Example
 *
 * ```tsx
 * import React from 'react'
 * import ReactDOM from 'react-dom'
 * import {
 * FormTypes
 *   IsOfflineContextProvider,
 *   OneBlinkReadOnlyForm,
 *   useIsMounted,
 * } from '@oneblink/apps-react'
 * import '@oneblink/apps-react/dist/styles.css'
 *
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
 *   const handleFormError = React.useCallback(() => {
 *     // handle form rendering error caused by a misconfigured form here...
 *   }, [isMounted])
 *
 *   return (
 *     <OneBlinkReadOnlyForm
 *       googleMapsApiKey={googleMapsApiKey}
 *       initialSubmission={null}
 *       form={form}
 *       audience="APPROVER"
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
export default React.memo(OneBlinkReadOnlyForm)
