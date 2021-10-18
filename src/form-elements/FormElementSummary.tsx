import * as React from 'react'
import { localisationService } from '@oneblink/apps'

import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import useFlattenElements from '../hooks/useFlattenElementsContext'
import { FormTypes } from '@oneblink/types'
import { FormElementValueChangeHandler } from '../types/form'
import { generateDate } from '../services/generate-default-data'
type Props = {
  element: FormTypes.SummaryElement
  onChange: FormElementValueChangeHandler
  value: unknown
}

const arraysAreEqual = (a: unknown[], b: unknown[]) => {
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
function FormElementSummary({ element, onChange, value }: Props) {
  const formSubmissionModel = useFormSubmissionModel()
  const flattenedElements = useFlattenElements()

  const reducer = React.useCallback(
    (partialSummary, formElement, submission) => {
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
              (
                partialSummary: FormElementSummaryResults,
                formElement: FormTypes.FormElement,
              ) =>
                reducer(
                  partialSummary,
                  formElement,
                  // Pleasing TypeScript
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
            (
              partialSummary: FormElementSummaryResults,
              formElement: FormTypes.FormElement,
            ) =>
              reducer(
                partialSummary,
                formElement,
                // Pleasing TypeScript
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
                  ({ value }: FormTypes.ChoiceElementOption) =>
                    optionValue === value,
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
          const date = generateDate({
            daysOffset: undefined,
            value: formElementValue,
            dateOnly: true,
          })
          if (date) {
            partialSummary.push(localisationService.formatDate(date))
          }
          break
        }
        case 'datetime': {
          if (typeof formElementValue !== 'string') return partialSummary
          partialSummary.push(
            localisationService.formatDatetime(new Date(formElementValue)),
          )
          break
        }
        case 'time': {
          if (typeof formElementValue !== 'string') return partialSummary
          partialSummary.push(
            localisationService.formatTime(new Date(formElementValue)),
          )
          break
        }
        default: {
          // Pleasing TypeScript WHILE COVERING ALL BASES
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
    const summary = flattenedElements.reduce(
      (partialSummary, formElement) => {
        return reducer(partialSummary, formElement, formSubmissionModel)
      },

      [],
    )

    if (value === undefined) {
      if (!summary.length) return
    }
    if (arraysAreEqual(value as FormElementSummaryResults, summary)) {
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
    formSubmissionModel,
    onChange,
    reducer,
    value,
  ])

  return (
    <div className="ob-form__element ob-summary cypress-summary-result ">
      {!!value && Array.isArray(value) && (
        <SummaryResult results={value}></SummaryResult>
      )}
    </div>
  )
}

type FormElementSummaryResults = Array<string | FormElementSummaryResults>
type FormElementSummaryResultProps = {
  results: FormElementSummaryResults
}

const SummaryResult = React.memo<FormElementSummaryResultProps>(
  function SummaryResult({ results }) {
    return (
      <>
        {results.map((result, i) => {
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
        })}
      </>
    )
  },
)

export default React.memo(FormElementSummary)
