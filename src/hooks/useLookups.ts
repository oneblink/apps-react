import * as React from 'react'
import { formElementsService } from '@oneblink/sdk-core'

import generateDefaultData from '../services/generate-default-data'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { SetFormSubmission } from '../types/form'

export default function useLookups(
  formId: number,
  setFormSubmission: SetFormSubmission,
) {
  const handlePagesLookupResult = React.useCallback(
    (
      element: FormTypes.LookupFormElement,
      elementLookupData: FormTypes.PageElement[],
      dataLookupResult?: SubmissionTypes.S3SubmissionData['submission'],
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
                  return formElementsService.findFormElement(
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
                // @ts-expect-error Sorry typescript, we need to add a property you don't approve of :(
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
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
        }
      })
    },
    [formId, setFormSubmission],
  )

  return {
    handlePagesLookupResult,
  }
}
