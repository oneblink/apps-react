import * as React from 'react'
import { formService } from '@oneblink/apps'

import generateDefaultData from '../services/generate-default-data'
import { FormTypes } from '@oneblink/types'

export default function useLookups(
  formId: number,
  setFormSubmission: SetFormSubmission,
) {
  const handlePagesLookupResult = React.useCallback(
    (
      element: FormTypes.LookupFormElement,
      elementLookupData: FormTypes.PageElement[],
      dataLookupResult?: FormElementsCtrl['model'],
    ) => {
      const newPageElements = elementLookupData.map((e) => ({
        ...e,
        injectedByElementId: element.id,
      }))
      setFormSubmission((currentFormSubmission) => {
        const definition: FormTypes.Form = {
          ...currentFormSubmission.definition,
          isMultiPage: true,
        }
        if (!currentFormSubmission.definition.isMultiPage) {
          definition.elements = [
            {
              id: formId.toString(),
              type: 'page',
              label: 'Page 1',
              elements: currentFormSubmission.definition.elements,
              conditionallyShow: false,
              requiresAllConditionallyShowPredicates: false,
            },
            ...newPageElements,
          ]
        } else {
          const indexOfPage =
            currentFormSubmission.definition.elements.findIndex(
              (pageElement: FormTypes.FormElement) => {
                if (pageElement.type === 'page') {
                  return formService.findFormElement(
                    pageElement.elements,
                    (el) => el.id === element.id,
                  )
                }
              },
            )
          if (indexOfPage === -1) {
            return currentFormSubmission
          }
          definition.elements =
            currentFormSubmission.definition.elements.reduce(
              (
                partialPageElements: FormTypes.FormElement[],
                pageElement: FormTypes.FormElement,
                index: number,
              ) => {
                // Sorry typescript, we need to add a property you don't approve of :(
                // @ts-expect-error ???
                if (pageElement.injectedByElementId !== element.id) {
                  partialPageElements.push(pageElement)
                }
                if (index === indexOfPage) {
                  partialPageElements.push(...newPageElements)
                }
                return partialPageElements
              },
              [],
            )
        }

        const submission = generateDefaultData(definition.elements, {
          ...currentFormSubmission.submission,
          ...dataLookupResult,
        })
        return {
          submission,
          definition,
        }
      })
    },
    [formId, setFormSubmission],
  )

  return {
    handlePagesLookupResult,
  }
}
