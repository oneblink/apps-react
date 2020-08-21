// @flow
'use strict'

import * as React from 'react'
import useFormSubmissionModel from 'form/hooks/useFormSubmissionModelContext'
import useFlattenElements from 'form/hooks/useFlattenElementsContext'
import vocabularyService from 'services/vocabulary-service'
type Props = {
  element: SummaryElement,
  formElementsCtrl: FormElementsCtrl,
  onChange: (FormElement, mixed | void) => mixed,
  value: mixed,
}

const arraysAreEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    if (a !== b) return false
    return true
  }
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    if (Array.isArray(a[i]) && Array.isArray(b[i])) {
      const areEqual = arraysAreEqual(a[i], b[i])
      if (!areEqual) return false
      continue
    }
    if (a[i] !== b[i]) return false
  }
  return true
}
function FormElementSummary({
  element,
  onChange,
  formElementsCtrl,
  value,
}: Props) {
  const getFormSubmissionModel = useFormSubmissionModel()
  const flattenedElements = useFlattenElements()

  const reducer = React.useCallback(
    (
      partialSummary,
      formElement,
      submission: $PropertyType<FormElementsCtrl, 'model'>,
    ) => {
      if (formElement.type === 'page') return partialSummary
      if (
        formElement.type !== 'repeatableSet' &&
        formElement.type !== 'form' &&
        !element.elementIds.some((elementId) => elementId === formElement.id)
      ) {
        return partialSummary
      }

      const formElementValue = submission[formElement.name]
      if (!formElementValue && formElementValue !== 0) {
        return partialSummary
      }

      switch (formElement.type) {
        case 'repeatableSet': {
          if (!Array.isArray(formElementValue)) return partialSummary
          // If we found a repeatable set, look through child elements
          // to find the summary elements. Need to start a new array for
          // this structure and look at each entry in the repeatable set
          for (const entry of formElementValue) {
            const repeatableSetSummaryValues = formElement.elements.reduce(
              (partialSummary, formElement) =>
                reducer(
                  partialSummary,
                  formElement,
                  // PLEASING FLOW
                  entry instanceof Object ? entry : {},
                ),
              [],
            )
            if (repeatableSetSummaryValues.length) {
              partialSummary.push(repeatableSetSummaryValues)
            }
          }
          break
        }
        case 'form': {
          const formSummaryValues = (formElement.elements || []).reduce(
            (partialSummary, formElement) =>
              reducer(
                partialSummary,
                formElement,
                // PLEASING FLOW
                formElementValue instanceof Object ? formElementValue : {},
              ),
            [],
          )
          if (formSummaryValues.length) {
            partialSummary.push(formSummaryValues)
          }

          break
        }
        case 'select':
        case 'autocomplete':
        case 'radio':
        case 'checkboxes': {
          const optionValues = []
          if (Array.isArray(formElementValue)) {
            optionValues.push(...formElementValue)
          } else {
            optionValues.push(formElementValue)
          }
          if (Array.isArray(formElement.options)) {
            partialSummary.push(
              ...optionValues.reduce((optionLabels, optionValue) => {
                const option = formElement.options.find(
                  ({ value }) => optionValue === value,
                )
                if (option) {
                  optionLabels.push(option.label)
                }
                return optionLabels
              }, []),
            )
          }
          break
        }
        case 'date': {
          if (typeof formElementValue !== 'string') return partialSummary
          partialSummary.push(
            vocabularyService.formatDate(new Date(formElementValue)),
          )
          break
        }
        case 'datetime': {
          if (typeof formElementValue !== 'string') return partialSummary
          partialSummary.push(
            vocabularyService.formatDatetime(new Date(formElementValue)),
          )
          break
        }
        case 'time': {
          if (typeof formElementValue !== 'string') return partialSummary
          partialSummary.push(
            vocabularyService.formatTime(new Date(formElementValue)),
          )
          break
        }
        default: {
          // PLEASING FLOW WHILE COVERING ALL BASES
          if (
            typeof formElementValue !== 'string' &&
            typeof formElementValue !== 'object' &&
            typeof formElementValue !== 'number' &&
            typeof formElementValue !== 'function' &&
            typeof formElementValue !== 'boolean'
          ) {
            return partialSummary
          }

          partialSummary.push(formElementValue.toString())
        }
      }
      return partialSummary
    },
    [element.elementIds],
  )

  // MODEL LISTENER
  React.useEffect(() => {
    const { submission } = getFormSubmissionModel(true)
    const summary = flattenedElements.reduce(
      (partialSummary, formElement) => {
        return reducer(partialSummary, formElement, submission)
      },

      [],
    )

    if (value === undefined) {
      if (!summary.length) return
    }
    if (arraysAreEqual(value, summary)) {
      return
    }
    if (summary.length) {
      onChange(element, summary)
    } else {
      onChange(element, undefined)
    }
  }, [
    element,
    flattenedElements,
    getFormSubmissionModel,
    onChange,
    reducer,
    value,
    formElementsCtrl,
  ])

  return (
    <div className="ob-form__element ob-summary cypress-summary-result ">
      {!!value && Array.isArray(value) && (
        // THE VALUE PROP HAS TO BE MIXED
        // $FlowFixMe
        <SummaryResult results={value}></SummaryResult>
      )}
    </div>
  )
}
type FormElementSummaryResults = Array<string | FormElementSummaryResults>
type FormElementSummaryResultProps = {
  results: FormElementSummaryResults,
}
const SummaryResult = React.memo(function SummaryResult({
  results,
}: FormElementSummaryResultProps) {
  return results.map((result, i) => {
    return (
      <div
        key={`${result.toString()}-${i}`}
        className="ob-summary__result-container"
      >
        {typeof result === 'string' ? (
          <p className="ob-summary__result has-line-breaks cypress-summary-result-text">
            {result}
          </p>
        ) : (
          <SummaryResult results={result}></SummaryResult>
        )}
      </div>
    )
  })
})
export default React.memo<Props>(FormElementSummary)
