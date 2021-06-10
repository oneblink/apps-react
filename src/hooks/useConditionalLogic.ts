import { Sentry } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import conditionallyShowElement from '../services/conditionally-show-element'
import conditionallyShowOption from '../services/conditionally-show-option'

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

  const pageFormElements = React.useMemo<FormTypes.FormElement[]>(
    () => [...pages],
    [pages],
  )

  const elementsOnPages = React.useMemo(
    () =>
      pages.reduce(
        (
          formElements: FormTypes.FormElement[],
          page: FormTypes.PageElement,
        ) => [...formElements, ...page.elements],
        [],
      ),
    [pages],
  )

  const rootFormElementsCtrl = React.useMemo(
    () => ({
      elements: elementsOnPages,
      model: submission,
      parentFormElementsCtrl: {
        elements: pageFormElements,
        model: submission,
      },
    }),
    [elementsOnPages, pageFormElements, submission],
  )

  const pageElementsConditionallyShown =
    React.useMemo<PageElementsConditionallyShown>(() => {
      const getFormElementConditionallyShown = (
        elements: FormTypes.FormElement[],
        element: FormTypes.FormElement,
        model: FormElementsCtrl['model'],
        parentFormElementsCtrl?: FormElementsCtrl,
      ): FormElementConditionallyShown => {
        const isShown = handleConditionallyShowElement(
          {
            elements,
            model,
            parentFormElementsCtrl,
          },
          element,
        )
        switch (element.type) {
          case 'page': {
            const formElementConditionallyShown: FormElementConditionallyShown =
              {
                type: 'page',
                isShown,
                formElements: {},
              }
            for (const nestedElement of element.elements) {
              if (nestedElement.type === 'page') {
                // Should never happen, just making typescript happy :)
                continue
              }

              formElementConditionallyShown.formElements[nestedElement.name] =
                getFormElementConditionallyShown(
                  elements,
                  nestedElement,
                  model,
                  {
                    model,
                    elements,
                    parentFormElementsCtrl,
                  },
                )
            }
            return formElementConditionallyShown
          }
          case 'section':
          case 'infoPage':
          case 'form': {
            const formElementConditionallyShown: FormElementConditionallyShown =
              {
                type: 'nestedForm',
                isShown,
                nested: {},
              }
            const nestedModel = model[element.name]
            if (
              isShown &&
              Array.isArray(element.elements) &&
              nestedModel &&
              typeof nestedModel === 'object'
            ) {
              for (const nestedElement of element.elements) {
                if (nestedElement.type === 'page') {
                  // Should never happen, just making typescript happy :)
                  continue
                }

                formElementConditionallyShown.nested[nestedElement.name] =
                  getFormElementConditionallyShown(
                    element.elements,
                    nestedElement,
                    nestedModel as FormElementsCtrl['model'],
                  )
              }
            }
            return formElementConditionallyShown
          }
          case 'repeatableSet': {
            const formElementConditionallyShown: FormElementConditionallyShown =
              {
                type: 'repeatableSet',
                isShown,
                entries: {},
              }
            if (isShown) {
              const entries = model[element.name]
              if (Array.isArray(entries)) {
                entries.forEach((entry, index) => {
                  formElementConditionallyShown.entries[index] =
                    element.elements.reduce(
                      (
                        partialFormElementsConditionallyShown: FormElementsConditionallyShown,
                        nestedElement,
                      ) => {
                        // Should never happen, just making typescript happy :)
                        if (
                          nestedElement.type !== 'page' &&
                          entry &&
                          typeof entry === 'object'
                        ) {
                          partialFormElementsConditionallyShown[
                            nestedElement.name
                          ] = getFormElementConditionallyShown(
                            element.elements,
                            nestedElement,
                            entry,
                            {
                              model,
                              elements,
                              parentFormElementsCtrl,
                            },
                          )
                        }
                        return partialFormElementsConditionallyShown
                      },
                      {},
                    )
                })
              }
            }
            return formElementConditionallyShown
          }
          default: {
            return {
              type: 'formElement',
              isShown,
            }
          }
        }
      }

      return pageFormElements.reduce(
        (
          partialFormElementsConditionallyShown: PageElementsConditionallyShown,
          pageElement,
        ) => {
          // @ts-expect-error ???
          partialFormElementsConditionallyShown[pageElement.id] =
            getFormElementConditionallyShown(
              rootFormElementsCtrl.elements,
              pageElement,
              rootFormElementsCtrl.model,
              {
                model: rootFormElementsCtrl.parentFormElementsCtrl.model,
                elements: rootFormElementsCtrl.parentFormElementsCtrl.elements,
              },
            )
          return partialFormElementsConditionallyShown
        },
        {},
      )
    }, [
      handleConditionallyShowElement,
      pageFormElements,
      rootFormElementsCtrl.elements,
      rootFormElementsCtrl.model,
      rootFormElementsCtrl.parentFormElementsCtrl.elements,
      rootFormElementsCtrl.parentFormElementsCtrl.model,
    ])

  const rootElementsConditionallyShown: FormElementsConditionallyShown =
    React.useMemo(() => {
      return Object.keys(pageElementsConditionallyShown).reduce(
        (memo: FormElementsConditionallyShown, pageId: string) => {
          return {
            ...memo,
            ...pageElementsConditionallyShown[pageId].formElements,
          }
        },
        {},
      )
    }, [pageElementsConditionallyShown])

  return {
    rootFormElementsCtrl,
    conditionalLogicError,
    pageElementsConditionallyShown,
    rootElementsConditionallyShown,
    handleConditionallyShowOption,
    elementsOnPages,
  }
}
