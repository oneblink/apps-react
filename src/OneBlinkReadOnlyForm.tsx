import * as React from 'react'
import OneBlinkFormBase, {
  OneBlinkReadOnlyFormProps,
} from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'
import { FormTypes } from '@oneblink/types'

const noop = () => {}

function UncontrolledOneBlinkReadOnlyForm({
  form,
  initialSubmission,
  ...rest
}: Extract<OneBlinkReadOnlyFormProps, { form: FormTypes.Form }>) {
  const [{ submission, definition, executedLookups }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  return (
    <OneBlinkFormBase
      {...rest}
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
    />
  )
}

function OneBlinkReadOnlyForm(props: OneBlinkReadOnlyFormProps) {
  if (props.editableFormElementIds) {
    return (
      <OneBlinkFormBase
        {...props}
        disabled={false}
        isReadOnly={true}
        onCancel={noop}
        onSubmit={noop}
        isPendingQueueEnabled={false}
      />
    )
  }

  return <UncontrolledOneBlinkReadOnlyForm {...props} />
}

/**
 * Component for rendering a OneBlink Form in read-only mode. By default, all
 * inputs are read-only. Pass `editableFormElementIds` with controlled
 * submission props (`definition`, `submission`, `setFormSubmission`,
 * `executedLookups`) to keep selected inputs editable. This component does
 * **not** render the submit, cancel or save draft buttons.
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
 *   useFormSubmissionState,
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
 *   const [
 *     { definition, submission, executedLookups },
 *     setFormSubmission,
 *   ] = useFormSubmissionState(form)
 *
 *   const handleFormError = React.useCallback(() => {
 *     // handle form rendering error caused by a misconfigured form here...
 *   }, [isMounted])
 *
 *   return (
 *     <OneBlinkReadOnlyForm
 *       googleMapsApiKey={googleMapsApiKey}
 *       definition={definition}
 *       submission={submission}
 *       setFormSubmission={setFormSubmission}
 *       executedLookups={executedLookups}
 *       audience="APPROVER"
 *       editableFormElementIds={['element-id']}
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
