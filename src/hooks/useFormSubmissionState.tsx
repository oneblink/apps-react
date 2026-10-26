import * as React from 'react'
import _cloneDeep from 'lodash.clonedeep'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import generateDefaultData, {
  GenerateDefaultDataOptions,
} from '../services/generate-default-data'
import { ExecutedLookups, SectionState } from '../types/form'
/**
 * This function is a simple wrapper around the react hook `useState()`. The
 * results can be passed to the [`<OneBlinkForm
 * />`](https://oneblink.github.io/apps-react/functions/OneBlinkForm.html)
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
 * @param sectionState
 * @param options Additional options for initialising the form submission state
 * @param options.generateDefaultDataOptions Options used when generating the
 *   initial submission data. Pass `{ skipDefaultValues: true }` when
 *   `initialSubmission` is an existing submission so form element default
 *   values are not applied to fields that were left blank.
 * @returns
 * @group Hooks
 */
export default function useFormSubmissionState(
  form: FormTypes.Form,
  initialSubmission?: SubmissionTypes.S3SubmissionData['submission'],
  lastElementUpdated?: FormTypes.FormElement,
  sectionState?: SectionState,
  options?: {
    generateDefaultDataOptions?: GenerateDefaultDataOptions
  },
) {
  return React.useState<{
    definition: FormTypes.Form
    submission: SubmissionTypes.S3SubmissionData['submission']
    lastElementUpdated: FormTypes.FormElement | undefined
    executedLookups: ExecutedLookups
    sectionState: SectionState | undefined
  }>(() => {
    const definition = _cloneDeep(form)
    const defaultData = generateDefaultData(
      definition.elements,
      initialSubmission || {},
      options?.generateDefaultDataOptions,
    )
    return {
      definition,
      submission: defaultData,
      lastElementUpdated,
      executedLookups: {},
      sectionState,
    }
  })
}
