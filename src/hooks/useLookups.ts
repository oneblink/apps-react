import * as React from 'react'
import { formService } from '@oneblink/apps'

import generateDefaultData from '../services/generate-default-data'
import { FormTypes } from '@oneblink/types'

export default function useLookups({
  formId,
  currentPageId,
  setDefinition,
  setSubmission,
}: {
  formId: number
  currentPageId: string
  setDefinition: React.Dispatch<React.SetStateAction<FormTypes.Form>>
  setSubmission: React.Dispatch<React.SetStateAction<FormElementsCtrl['model']>>
}) {
  const handleChangeElements = React.useCallback(
    (elements /* : FormElement[] */) => {
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
    (
      element: FormTypes.LookupFormElement,
      elementLookupData: FormTypes.PageElement[],
    ) => {
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
          (pageElement: FormTypes.FormElement) => {
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
            (
              partialPageElements: FormTypes.FormElement[],
              pageElement: FormTypes.FormElement,
              index: number,
            ) => {
              // Sorry flow, we need to add a property you don't approve of :(
              // @ts-expect-error
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
    (model: FormElementsCtrl['model']) => {
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
