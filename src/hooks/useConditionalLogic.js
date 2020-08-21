// @flow
'use strict'

import * as React from 'react'

import conditionallyShowElement from '../services/conditionally-show-element'
import conditionallyShowOption from '../services/conditionally-show-option'

export default function useConditionalLogic(
  {
    submission,
    pages,
  } /* : {
  submission: $PropertyType<FormElementsCtrl, 'model'>,
  pages: PageElement[],
} */,
) {
  const [conditionalLogicState, setConditionalLogicState] = React.useState(null)

  const handleConditionallyShowElement = React.useCallback((
    formElementsCtrl /* : FormElementsCtrl */,
    element /* : FormElement */,
  ) => {
    if (!element.conditionallyShow) return true
    const elementsEvaluated = []
    try {
      return conditionallyShowElement(
        formElementsCtrl,
        element,
        elementsEvaluated,
      )
    } catch (error) {
      console.warn(
        'Error while checking if element is conditional shown',
        error,
      )
      setConditionalLogicState({
        elements: elementsEvaluated,
        message: error.message,
      })
      return false
    }
  }, [])

  const handleConditionallyShowOption = React.useCallback((
    formElementsCtrl /* : FormElementsCtrl */,
    element /* : FormElementWithOptions */,
    option /* : ChoiceElementOption */,
  ) => {
    const elementsEvaluated = []
    try {
      return conditionallyShowOption(
        formElementsCtrl,
        element,
        option,
        elementsEvaluated,
      )
    } catch (error) {
      setConditionalLogicState({
        elements: elementsEvaluated,
        message: error.message,
      })
      return false
    }
  }, [])

  const pageFormElements /* : FormElement[] */ = React.useMemo(
    () => [...pages],
    [pages],
  )

  const elementsOnPages = React.useMemo(
    () =>
      pages.reduce(
        (formElements, page) => [...formElements, ...page.elements],
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

  const pageElementsConditionallyShown /* : PageElementsConditionallyShown */ = React.useMemo(() => {
    const getFormElementConditionallyShown = (
      elements,
      element,
      model,
      parentFormElementsCtrl,
    ) /* : FormElementConditionallyShown */ => {
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
          const formElementConditionallyShown = {
            type: 'page',
            isShown,
            formElements: {},
          }
          for (const nestedElement of element.elements) {
            if (nestedElement.type === 'page') {
              // Should never happen, just making flow happy :)
              continue
            }

            formElementConditionallyShown.formElements[
              nestedElement.name
            ] = getFormElementConditionallyShown(
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
        case 'infoPage':
        case 'form': {
          const formElementConditionallyShown = {
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
                // Should never happen, just making flow happy :)
                continue
              }

              formElementConditionallyShown.nested[
                nestedElement.name
              ] = getFormElementConditionallyShown(
                element.elements,
                nestedElement,
                nestedModel,
              )
            }
          }
          return formElementConditionallyShown
        }
        case 'repeatableSet': {
          const formElementConditionallyShown = {
            type: 'repeatableSet',
            isShown,
            entries: {},
          }
          if (isShown) {
            const entries = model[element.name]
            if (Array.isArray(entries)) {
              entries.forEach((entry, index) => {
                formElementConditionallyShown.entries[
                  index
                ] = element.elements.reduce(
                  (partialFormElementsConditionallyShown, nestedElement) => {
                    // Should never happen, just making flow happy :)
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
      (partialFormElementsConditionallyShown, pageElement) => {
        partialFormElementsConditionallyShown[
          pageElement.id
        ] = getFormElementConditionallyShown(
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

  return {
    rootFormElementsCtrl,
    conditionalLogicState,
    pageElementsConditionallyShown,
    handleConditionallyShowOption,
    elementsOnPages,
  }
}
