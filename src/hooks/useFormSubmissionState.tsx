import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import generateDefaultData from '../services/generate-default-data'
import { ExecutedLookups } from '../typedoc'
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
 * @group Hooks
 */
export default function useFormSubmissionState(
  form: FormTypes.Form,
  initialSubmission?: SubmissionTypes.S3SubmissionData['submission'],
  lastElementUpdated?: FormTypes.FormElement,
) {
  return React.useState<{
    definition: FormTypes.Form
    submission: SubmissionTypes.S3SubmissionData['submission']
    lastElementUpdated: FormTypes.FormElement | undefined
    executedLookups: ExecutedLookups
  }>(() => {
    const definition = _cloneDeep(form)
    const defaultData = generateDefaultData(
      definition.elements,
      initialSubmission || {},
    )
    return {
      definition,
      submission: defaultData,
      lastElementUpdated,
      executedLookups: {},
    }
  })
}
