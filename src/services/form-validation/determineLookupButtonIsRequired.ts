import { FormTypes, SubmissionTypes } from '@oneblink/types'

export function determineLookupButtonIsRequired(
  elementDependencies: FormTypes.LookupButtonFormElement['elementDependencies'],
  elements: FormTypes.FormElement[],
  submissions: Array<SubmissionTypes.S3SubmissionData['submission']>,
): boolean {
  for (const elementDependency of elementDependencies) {
    const formElement = elements.find(
      (formElement) => formElement.id === elementDependency.elementId,
    )
    if (formElement && 'required' in formElement && formElement.required) {
      return true
    }

    switch (elementDependency.type) {
      case 'REPEATABLE_SET_FORM_ELEMENT': {
        if (formElement?.type === 'repeatableSet') {
          const entries = submissions.reduce<
            Array<SubmissionTypes.S3SubmissionData['submission']>
          >((memo, submission) => {
            const subEntries = submission?.[formElement.name]
            if (Array.isArray(subEntries) && subEntries.length) {
              memo.push(...subEntries)
            }
            return memo
          }, [])
          if (Array.isArray(entries) && entries.length) {
            const hasNestedRequiredFormElements =
              determineLookupButtonIsRequired(
                [elementDependency.elementDependency],
                formElement.elements,
                entries,
              )
            if (hasNestedRequiredFormElements) {
              return true
            }
          }
        }
        break
      }
      case 'FORM_FORM_ELEMENT': {
        if (
          formElement?.type === 'form' &&
          Array.isArray(formElement.elements)
        ) {
          const hasNestedRequiredFormElements = determineLookupButtonIsRequired(
            [elementDependency.elementDependency],
            formElement.elements,
            submissions.reduce<
              Array<SubmissionTypes.S3SubmissionData['submission']>
            >((memo, submission) => {
              const subEntry = submission?.[formElement.name]
              if (subEntry) {
                memo.push(
                  subEntry as SubmissionTypes.S3SubmissionData['submission'],
                )
              }
              return memo
            }, []),
          )
          if (hasNestedRequiredFormElements) {
            return true
          }
        }
        break
      }
    }
  }
  return false
}
