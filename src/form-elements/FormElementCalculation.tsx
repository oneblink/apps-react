import * as React from 'react'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import { FormTypes } from '@oneblink/types'
import { Sentry } from '../apps'
import { localisationService } from '../apps'
import { FormElementValueChangeHandler } from '../types/form'
import { calculationService } from '@oneblink/sdk-core'
import QuillHTML from '../components/QuillHTML'
import MaterialIcon from '../components/MaterialIcon'
import useFormDefinition from '../hooks/useFormDefinition'

type Props = {
  element: FormTypes.CalculationElement
  onChange: FormElementValueChangeHandler<number>
  value: unknown | undefined
}

function FormElementCalculation({ element, onChange, value }: Props) {
  const { formSubmissionModel } = useFormSubmissionModel()
  const form = useFormDefinition()

  const htmlValue = React.useMemo(() => {
    let htmlTemplate

    if (!isNaN(value as number)) {
      htmlTemplate = element.defaultValue
    } else {
      console.log(
        '[Calculation] Was not a number... setting pre-calculation display',
      )
      htmlTemplate = element.preCalculationDisplay
    }

    const numberValue = typeof value === 'number' ? value : 0
    return (htmlTemplate || '').replace(
      /{result}/gi,
      element.displayAsCurrency
        ? localisationService.formatCurrency(numberValue)
        : localisationService.formatNumber(numberValue),
    )
  }, [
    element.defaultValue,
    element.displayAsCurrency,
    element.preCalculationDisplay,
    value,
  ])

  const { calculatedValue, hasError } = React.useMemo(() => {
    try {
      if (!element.calculation) {
        throw new Error('Element has no calculation.')
      }

      return {
        calculatedValue: calculationService.evaluateExpression({
          expression: element.calculation,
          submission: formSubmissionModel,
          formElements: form.elements,
          parseDayOnlyDate: localisationService.parseDayOnlyDate,
        }),
        hasError: false,
      }
    } catch (e) {
      console.warn(
        'Error while setting up parsing for calculation element',
        element,
        e,
      )
      Sentry.captureException(e)
      return {
        calculatedValue: undefined,
        hasError: true,
      }
    }
  }, [element, form.elements, formSubmissionModel])

  // MODEL LISTENER
  React.useEffect(() => {
    onChange(element, {
      value: calculatedValue,
    })
  }, [element, onChange, calculatedValue])

  return (
    <div className="cypress-calculation-element">
      <div className="ob-form__element ob-calculation">
        <QuillHTML
          html={htmlValue}
          className="cypress-calculation-result ob-calculation__content"
        />
        {hasError && (
          <div
            className="notification cypress-calculation-is-invalid"
            role="alert"
          >
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <MaterialIcon className="has-text-warning">error</MaterialIcon>
              </div>
              <div className="column">
                <p>There is an error in the calculation for this element.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(FormElementCalculation)
