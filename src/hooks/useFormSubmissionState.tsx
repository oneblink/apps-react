import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { FormTypes } from '@oneblink/types'
import generateDefaultData from '../services/generate-default-data'
import { FormSubmissionModel } from '../types/form'
/**
 * This function is a simple wrapper around the react hook `useState()`. The
 * results can be passed to the [`<OneBlinkForm
 * />`](https://oneblink.github.io/apps-react/somewhere) //TODO: Fix link
 * component.
 *
 * ## Example
 *
 * ```js
 * import {
 *   useFormSubmissionState,
 *   OneBlinkFormControlled,
 * } from '@oneblink/apps-react'
 *
 * function Uncontrolled({ form, initialSubmission, ...props }) {
 *   const [{ definition, submission }, setFormSubmission] =
 *     useFormSubmissionState(form, initialSubmission)
 *
 *   return (
 *     <OneBlinkFormControlled
 *       {...props}
 *       definition={definition}
 *       submission={submission}
 *       setFormSubmission={setFormSubmission}
 *       lastElementUpdated={lastElementUpdated}
 *     />
 *   )
 * }
 * ```
 *
 * @param form The OneBlink Form to render
 * @param initialSubmission The initial submission data to populate the form
 *   with
 * @param lastElementUpdated
 * @returns
 */
export default function useFormSubmissionState(
  form: FormTypes.Form,
  initialSubmission?: FormSubmissionModel,
  lastElementUpdated?: FormTypes.FormElement,
) {
  return React.useState(() => {
    const definition = _cloneDeep(form)
    const defaultData = generateDefaultData(
      definition.elements,
      initialSubmission || {},
    )
    return {
      definition,
      submission: defaultData,
      lastElementUpdated,
    }
  })
}
