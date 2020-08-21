// @flow

import * as React from 'react'
import { formService } from '@oneblink/apps'

import generateDefaultData from 'form/services/generate-default-data'

export default function useLookups({
  formId,
  currentPageId,
  setDefinition,
  setSubmission,
}: {
  formId: number,
  currentPageId: string,
  setDefinition: ((Form) => Form) => void,
  setSubmission: (
    (
      $PropertyType<FormElementsCtrl, 'model'>,
    ) => $PropertyType<FormElementsCtrl, 'model'>,
  ) => void,
}) {
  const handleChangeElements = React.useCallback(
    (elements: FormElement[]) => {
      setDefinition((currentDefinition) => {
        if (currentPageId === formId.toString()) {
          return {
            ...currentDefinition,
            elements,
          }
        } else {
          return {
            ...currentDefinition,
            elements: currentDefinition.elements.map((pageElement) => {
              if (
                pageElement.id === currentPageId &&
                pageElement.type === 'page'
              ) {
                return {
                  ...pageElement,
                  elements,
                }
              } else {
                return pageElement
              }
            }),
          }
        }
      })
    },
    [currentPageId, formId, setDefinition],
  )

  const injectPagesAfter = React.useCallback(
    (element: LookupFormElement, elementLookupData: PageElement[]) => {
      const newPageElements = elementLookupData.map((e) => ({
        ...e,
        injectedByElementId: element.id,
      }))
      setDefinition((currentDefinition) => {
        if (!currentDefinition.isMultiPage) {
          return {
            ...currentDefinition,
            isMultiPage: true,
            elements: [
              {
                id: formId.toString(),
                type: 'page',
                label: 'Page 1',
                elements: currentDefinition.elements,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
              },
              ...newPageElements,
            ],
          }
        }

        const pageWithElement = currentDefinition.elements.find(
          (pageElement) => {
            if (pageElement.type === 'page') {
              return formService.findFormElement(
                pageElement.elements,
                (el) => el.id === element.id,
              )
            }
          },
        )
        if (!pageWithElement) {
          return currentDefinition
        }

        const indexOfPage = currentDefinition.elements.indexOf(pageWithElement)

        return {
          ...currentDefinition,
          elements: currentDefinition.elements.reduce(
            (partialPageElements, pageElement, index) => {
              // Sorry flow, we need to add a property you don't approve of :(
              // $FlowFixMe
              if (pageElement.injectedByElementId !== element.id) {
                partialPageElements.push(pageElement)
              }
              if (index === indexOfPage) {
                partialPageElements.push(...newPageElements)
              }
              return partialPageElements
            },
            [],
          ),
        }
      })

      setSubmission((currentSubmission) => {
        const newSubmission = newPageElements.reduce(
          (partialSubmission, pageElement) => {
            const model = generateDefaultData(pageElement.elements, {})
            return Object.assign(partialSubmission, model)
          },
          {},
        )
        return {
          ...newSubmission,
          ...currentSubmission,
        }
      })
    },
    [formId, setDefinition, setSubmission],
  )

  const handleChangeModel = React.useCallback(
    (model: $PropertyType<FormElementsCtrl, 'model'>) => {
      setSubmission(() => model)
    },
    [setSubmission],
  )

  return {
    handleChangeElements,
    handleChangeModel,
    injectPagesAfter,
  }
}
