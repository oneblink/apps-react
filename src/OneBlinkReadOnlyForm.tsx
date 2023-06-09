import * as React from 'react'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import OneBlinkFormBase from './OneBlinkFormBase'
import useFormSubmissionState from './hooks/useFormSubmissionState'

function recursivelySetReadOnly(
  elements: FormTypes.FormElement[],
): FormTypes.FormElement[] {
  const newElements = elements
    .filter((element) => element.type !== 'captcha')
    .map((element) => {
      if (
        (element.type === 'form' ||
          element.type === 'section' ||
          element.type === 'page' ||
          element.type === 'repeatableSet') &&
        Array.isArray(element.elements)
      ) {
        return {
          ...element,
          elements: recursivelySetReadOnly(element.elements) || [],
        }
      }

      if (
        element.type !== 'section' &&
        element.type !== 'heading' &&
        element.type !== 'page' &&
        element.type !== 'html' &&
        element.type !== 'captcha' &&
        element.type !== 'image' &&
        element.type !== 'calculation' &&
        element.type !== 'summary' &&
        element.type !== 'form' &&
        element.type !== 'infoPage'
      ) {
        return {
          ...element,
          readOnly: true,
        }
      }

      return element
    })

  return newElements
}

function OneBlinkReadOnlyForm({
  form,
  initialSubmission,
  ...rest
}: {
  form: FormTypes.Form
  initialSubmission?: SubmissionTypes.S3SubmissionData['submission']
  googleMapsApiKey?: string
}) {
  const [{ submission, definition }, setFormSubmission] =
    useFormSubmissionState(form, initialSubmission)

  const readOnlyDefinition = React.useMemo(() => {
    return {
      ...definition,
      elements: recursivelySetReadOnly(definition.elements || []),
    }
  }, [definition])

  const noop = React.useCallback(() => {}, [])

  return (
    <OneBlinkFormBase
      definition={readOnlyDefinition}
      submission={submission}
      disabled={true}
      isReadOnly={true}
      onCancel={noop}
      onSubmit={noop}
      setFormSubmission={setFormSubmission}
      isPendingQueueEnabled={false}
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
 * import { FormTypes } from '@oneblink/apps'
 * import {
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
 */
export default React.memo(OneBlinkReadOnlyForm)
