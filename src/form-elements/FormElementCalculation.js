// @flow
'use strict'

import * as React from 'react'
import ExpressionParser from 'morph-expressions'
import escapeString from 'escape-string-regexp'
import { sanitizeHtmlStandard } from 'form/services/sanitize-html'
import useFormSubmissionModel from 'form/hooks/useFormSubmissionModelContext'
type Props = {
  element: CalculationElement,
  formElementsCtrl: FormElementsCtrl | void,
  onChange: (FormElement, number | void) => mixed,
  parentFormName?: string,
  value: mixed,
}

const isUnenteredValue = (value) => {
  return !value && value !== 0
}

function FormElementCalculation({
  element,
  onChange,
  formElementsCtrl,
  parentFormName,
  value,
}: Props) {
  const getFormSubmissionModel = useFormSubmissionModel()

  const htmlValue = React.useMemo(() => {
    let htmlTemplate

    if (!isNaN(value)) {
      htmlTemplate = element.defaultValue
    } else {
      console.log(
        '[Calculation] Was not a number... setting pre-calculation display',
      )
      htmlTemplate = element.preCalculationDisplay
    }
    // Add commas in number
    const [number, decimal] = (typeof value === 'number' ? value : 0)
      .toString()
      .split('.')
    const numberWithCommas = number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const stringValue = decimal
      ? `${numberWithCommas}.${decimal}`
      : numberWithCommas
    return sanitizeHtmlStandard(
      (htmlTemplate || '').replace(/{result}/gi, stringValue),
    )
  }, [element, value])

  const registerProperty = React.useCallback(
    (
      exprParser,
      {
        replacement,
        nestedElementNames,
      }: {
        replacement: string,
        nestedElementNames: string[],
      },
    ) => {
      exprParser.registerProperty(replacement, (submission) => {
        let defaultAccumulator = submission
        // ACCOUNT FOR NESTED FORM CASE
        if (parentFormName) {
          for (const level of parentFormName.split('|')) {
            if (defaultAccumulator) {
              defaultAccumulator = defaultAccumulator[level]
            }
          }
        }
        if (!defaultAccumulator) return NaN
        defaultAccumulator = defaultAccumulator[nestedElementNames[0]]

        return nestedElementNames.reduce((elementValue, elementName, index) => {
          // Numbers can just be returned as is
          if (typeof elementValue === 'number') {
            return elementValue
          }

          // attempt to get a number from the element value as a string.
          // NaN is accounted for is the calculation
          // so we can return that from here
          if (typeof elementValue === 'string') {
            return parseFloat(elementValue)
          }

          if (Array.isArray(elementValue)) {
            // If there are no entries, we can return null
            // to prevent the calculation from running.
            if (!elementValue.length) {
              return NaN
            }

            // An array could be an element that allows multiple
            // values e.g. checkboxes. If thats that case, we just
            // add them all together and move on
            const elementValues = elementValue.map((entry) => parseFloat(entry))
            if (elementValues.every((entry) => !Number.isNaN(entry))) {
              return elementValues.reduce((number, entry) => number + entry, 0)
            }

            // Other wise attempt to process it as a repeatable set
            // If we found another repeatable set to process,
            // pass it to the next element name to
            // iterate over the entries

            // If we are processing the entries in a repeatable set,
            // we can sum the numbers elements in the entries
            const currentElementName = nestedElementNames[index + 1]

            let isNestedRepeatableSet = false
            const nestedElementValues = elementValue.reduce(
              (nestedElementValues, entry) => {
                if (entry) {
                  const nextElementValue = entry[currentElementName]
                  if (Array.isArray(nextElementValue)) {
                    if (nextElementValue.length) {
                      nestedElementValues.push(...nextElementValue)
                      isNestedRepeatableSet = true
                    }
                  } else {
                    nestedElementValues.push(nextElementValue)
                  }
                }
                return nestedElementValues
              },
              [],
            )

            // If the nested element values are all arrays, we can pass them on the the next
            if (isNestedRepeatableSet) {
              return nestedElementValues
            }

            return nestedElementValues.reduce((total, nestedElementValue) => {
              if (Number.isNaN(total)) {
                return NaN
              }
              const value = parseFloat(nestedElementValue)
              if (Number.isNaN(value)) {
                return NaN
              }
              const newTotal =
                total + (Number.isFinite(value) ? value : nestedElementValue)
              return newTotal
            }, 0)
          }

          // We did not find a number value from the known elements,
          // we will assume we are at the end of the line.
          return NaN
        }, defaultAccumulator)
      })
    },
    [parentFormName],
  )

  const { calculation, hasError } = React.useMemo(() => {
    const exprParser = new ExpressionParser()
    exprParser.registerFunction('ROUND', (value, precision) => {
      if (!Number.isNaN(value) && Number.isFinite(value)) {
        return parseFloat(value.toFixed(precision))
      }
      return null
    })
    exprParser.registerFunction('ISNULL', (value, defaultValue) => {
      if (isUnenteredValue(value)) {
        return defaultValue || 0
      }
      return value
    })

    try {
      if (!element.calculation) throw new Error('Element has no calculation.')
      let matches
      const elementNames = []
      const re = /({ELEMENT:)([^}]+)(})/g

      while ((matches = re.exec(element.calculation)) !== null) {
        if (matches) {
          elementNames.push(matches[2])
        }
      }

      const code = elementNames.reduce((code, elementName, index) => {
        const regex = new RegExp(escapeString(`{ELEMENT:${elementName}}`), 'g')
        const replacement = `a${index}`
        registerProperty(exprParser, {
          replacement,
          nestedElementNames: elementName.split('|'),
        })
        return code.replace(regex, replacement)
      }, element.calculation || '')

      return {
        calculation: exprParser.parse(code.trim()),
        hasError: false,
      }
    } catch (e) {
      console.warn(
        'Error while setting up parsing for calculation element',
        element,
        e,
      )
      return {
        calculation: null,
        hasError: true,
      }
    }
  }, [element, registerProperty])

  // MODEL LISTENER
  React.useEffect(() => {
    if (!calculation) return
    const submission = getFormSubmissionModel(false).submission
    const newValue = calculation.eval(submission)
    if (value === undefined) {
      if (Object.is(NaN, newValue)) return
    }
    if (value === newValue) return // VALUE DID NOT CHANGE
    if (!isNaN(newValue)) {
      onChange(element, newValue)
    } else {
      onChange(element, undefined)
    }
  }, [
    calculation,
    element,
    getFormSubmissionModel,
    // Want to re-evaluate when the submission model changes
    formElementsCtrl,
    onChange,
    value,
  ])

  return (
    <div className="cypress-calculation-element">
      <div className="ob-form__element ob-calculation">
        <div
          className="cypress-calculation-result"
          dangerouslySetInnerHTML={{ __html: htmlValue }}
        ></div>
        {hasError && (
          <div
            className="notification cypress-calculation-is-invalid"
            role="alert"
          >
            <div className="columns is-vcentered">
              <div className="column is-narrow">
                <i className="material-icons has-text-warning">error</i>
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

export default React.memo<Props>(FormElementCalculation)
