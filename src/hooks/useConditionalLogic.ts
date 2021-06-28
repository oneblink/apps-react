import { Sentry } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import conditionallyShowElement, {
  FormElementsCtrl,
} from '../services/conditionally-show-element'
import conditionallyShowOption from '../services/conditionally-show-option'
import flattenFormElements from '../services/flattenFormElements'
import {
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
  FormSubmissionModel,
  RepeatableSetEntryIndex,
} from '../types/form'

export default function useConditionalLogic(
  definition: FormTypes.Form,
  submission: FormSubmissionModel,
) {
  const [conditionalLogicError, setConditionalLogicError] = React.useState<
    Error | undefined
  >()

  const handleConditionallyShowElement = React.useCallback(
    (formElementsCtrl: FormElementsCtrl, element: FormTypes.FormElement) => {
      try {
        return conditionallyShowElement(formElementsCtrl, element, [])
      } catch (error) {
        Sentry.captureException(error)
        console.warn(
          'Error while checking if element is conditional shown',
          error,
        )
        setConditionalLogicError(error)
        return false
      }
    },
    [],
  )

  const handleConditionallyShowOption = React.useCallback(
    (
      formElementsCtrl: FormElementsCtrl,
      element: FormTypes.FormElementWithOptions,
      option: FormTypes.ChoiceElementOption,
    ) => {
      try {
        return conditionallyShowOption(formElementsCtrl, element, option, [])
      } catch (error) {
        Sentry.captureException(error)
        setConditionalLogicError(error)
        return false
      }
    },
    [],
  )

  const generateFormElementsConditionallyShown = React.useCallback(
    (
      elements: FormTypes.FormElement[],
      model: FormSubmissionModel,
      parentFormElementsCtrl: FormElementsCtrl['parentFormElementsCtrl'],
    ): FormElementsConditionallyShown => {
      const formElementsCtrl = {
        elements: flattenFormElements(elements),
        model,
        parentFormElementsCtrl,
      }
      return formElementsCtrl.elements.reduce<FormElementsConditionallyShown>(
        (formElementsConditionallyShown, element) => {
          switch (element.type) {
            case 'section':
            case 'page': {
              const formElementConditionallyShown =
                formElementsConditionallyShown[element.id]
              const isHidden = formElementConditionallyShown
                ? formElementConditionallyShown.isHidden
                : !handleConditionallyShowElement(formElementsCtrl, element)

              formElementsConditionallyShown[element.id] = {
                type: 'formElement',
                isHidden,
              }

              // If the parent element is hidden, hide all the child elements
              if (isHidden) {
                element.elements.forEach((childElement) => {
                  switch (childElement.type) {
                    case 'section':
                    case 'page': {
                      formElementsConditionallyShown[childElement.id] = {
                        type: 'formElement',
                        isHidden: true,
                      }
                      break
                    }
                    default: {
                      formElementsConditionallyShown[childElement.name] = {
                        type: 'formElement',
                        isHidden: true,
                      }
                    }
                  }
                })
              }
              break
            }
            case 'infoPage':
            case 'form': {
              if (formElementsConditionallyShown[element.name]) {
                break
              }
              const nestedModel = model[element.name] as
                | FormSubmissionModel
                | undefined
              formElementsConditionallyShown[element.name] = {
                type: 'formElements',
                isHidden: !handleConditionallyShowElement(
                  formElementsCtrl,
                  element,
                ),
                formElements: generateFormElementsConditionallyShown(
                  element.elements || [],
                  nestedModel || {},
                  formElementsCtrl,
                ),
              }
              break
            }
            case 'repeatableSet': {
              if (formElementsConditionallyShown[element.name]) {
                break
              }
              const entries = formElementsCtrl.model[element.name] as
                | Array<FormSubmissionModel>
                | undefined
              formElementsConditionallyShown[element.name] = {
                type: 'repeatableSet',
                isHidden: !handleConditionallyShowElement(
                  formElementsCtrl,
                  element,
                ),
                entries: (entries || []).reduce(
                  (
                    result: Record<
                      RepeatableSetEntryIndex,
                      FormElementsConditionallyShown | undefined
                    >,
                    entry,
                    index,
                  ) => {
                    result[index.toString()] =
                      generateFormElementsConditionallyShown(
                        element.elements,
                        entry,
                        formElementsCtrl,
                      )
                    return result
                  },
                  {},
                ),
              }
              break
            }
            default: {
              if (formElementsConditionallyShown[element.name]) {
                break
              }
              const formElementConditionallyShown: FormElementConditionallyShown =
                {
                  type: 'formElement',
                  isHidden: !handleConditionallyShowElement(
                    formElementsCtrl,
                    element,
                  ),
                }

              if (!formElementConditionallyShown.isHidden) {
                switch (element.type) {
                  case 'compliance':
                  case 'autocomplete':
                  case 'radio':
                  case 'checkboxes':
                  case 'select': {
                    if (
                      element.conditionallyShowOptions &&
                      Array.isArray(element.options)
                    ) {
                      formElementConditionallyShown.options =
                        element.options.filter((option) =>
                          handleConditionallyShowOption(
                            formElementsCtrl,
                            element,
                            option,
                          ),
                        )
                    }
                    break
                  }
                }
              }

              formElementsConditionallyShown[element.name] =
                formElementConditionallyShown
            }
          }

          return formElementsConditionallyShown
        },
        {},
      )
    },
    [handleConditionallyShowElement, handleConditionallyShowOption],
  )

  const formElementsConditionallyShown =
    React.useMemo<FormElementsConditionallyShown>(() => {
      return generateFormElementsConditionallyShown(
        definition.elements,
        submission,
        undefined,
      )
    }, [
      definition.elements,
      generateFormElementsConditionallyShown,
      submission,
    ])

  return {
    conditionalLogicError,
    formElementsConditionallyShown,
  }
}
