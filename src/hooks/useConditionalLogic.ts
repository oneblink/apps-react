import { Sentry } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import conditionallyShowElement from '../services/conditionally-show-element'
import conditionallyShowOption from '../services/conditionally-show-option'
import flattenFormElements from '../services/flattenFormElements'

export default function useConditionalLogic({
  submission,
  pages,
}: {
  submission: FormElementsCtrl['model']
  pages: FormTypes.PageElement[]
}) {
  const [conditionalLogicError, setConditionalLogicError] =
    React.useState<Error | undefined>()

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
      const elementsEvaluated: string[] = []
      try {
        return conditionallyShowOption(
          formElementsCtrl,
          element,
          option,
          elementsEvaluated,
        )
      } catch (error) {
        Sentry.captureException(error)
        setConditionalLogicError(error)
        return false
      }
    },
    [],
  )

  const flattenedElements = React.useMemo(
    () => flattenFormElements(pages),
    [pages],
  )

  const rootFormElementsCtrl = React.useMemo(
    () => ({
      elements: flattenedElements,
      model: submission,
    }),
    [flattenedElements, submission],
  )

  const formElementsConditionallyShown =
    React.useMemo<FormElementsConditionallyShown>(() => {
      const generateFormElementsConditionallyShown = (
        formElementsCtrl: FormElementsCtrl,
      ): FormElementsConditionallyShown => {
        return formElementsCtrl?.elements.reduce<FormElementsConditionallyShown>(
          (formElementsConditionallyShown, element) => {
            const isShown = handleConditionallyShowElement(
              formElementsCtrl,
              element,
            )
            switch (element.type) {
              case 'section':
              case 'page': {
                if (formElementsConditionallyShown[element.id]) {
                  break
                }
                formElementsConditionallyShown[element.id] = {
                  type: 'formElement',
                  isShown,
                }
                // If the parent element is not hidden, hide all the children elements
                if (!isShown) {
                  element.elements.forEach((childElement) => {
                    switch (childElement.type) {
                      case 'section':
                      case 'page': {
                        formElementsConditionallyShown[childElement.id] = {
                          type: 'formElement',
                          isShown: false,
                        }
                        break
                      }
                      default: {
                        formElementsConditionallyShown[childElement.name] = {
                          type: 'formElement',
                          isShown: false,
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
                const nestedModel = formElementsCtrl.model[element.name] as
                  | FormElementsCtrl['model']
                  | undefined
                formElementsConditionallyShown[element.name] = {
                  type: 'formElements',
                  isShown,
                  formElements: generateFormElementsConditionallyShown({
                    model: nestedModel || {},
                    elements: element.elements || [],
                    parentFormElementsCtrl: formElementsCtrl,
                  }),
                }
                break
              }
              case 'repeatableSet': {
                if (formElementsConditionallyShown[element.name]) {
                  break
                }
                const entries = formElementsCtrl.model[element.name] as
                  | Array<FormElementsCtrl['model']>
                  | undefined
                formElementsConditionallyShown[element.name] = {
                  type: 'repeatableSet',
                  isShown,
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
                        generateFormElementsConditionallyShown({
                          model: entry,
                          elements: element.elements,
                          parentFormElementsCtrl: formElementsCtrl,
                        })
                      return result
                    },
                    {},
                  ),
                }
                break
              }
              default: {
                if (!formElementsConditionallyShown[element.name]) {
                  formElementsConditionallyShown[element.name] = {
                    type: 'formElement',
                    isShown,
                  }
                }
              }
            }

            return formElementsConditionallyShown
          },
          {},
        )
      }

      return generateFormElementsConditionallyShown(rootFormElementsCtrl)
    }, [handleConditionallyShowElement, rootFormElementsCtrl])

  return {
    rootFormElementsCtrl,
    conditionalLogicError,
    formElementsConditionallyShown,
    handleConditionallyShowOption,
  }
}
