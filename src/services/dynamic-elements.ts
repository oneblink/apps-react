// This file houses logic related to dynamic elements
// (Our term for elements that are created exclusively by our logic for display on the client side).
// These elements are not part of the form definition or the stored form submission.

import { FormTypes } from '@oneblink/types'
import { FormElementWithDynamicElement } from '../types/oneblink'

export const generateConfirmationFormElementName = (
  formElement: FormTypes.EmailElement,
) => {
  return window.btoa(formElement.name)
}

const isDynamicElement = (element: FormElementWithDynamicElement): boolean => {
  return !!element.isDynamicElement
}

export const injectDynamicElements = (
  formElements: FormTypes.FormElement[],
) => {
  return formElements.reduce<FormElementWithDynamicElement[]>(
    (
      memo,
      formElement,
      // elementIndex
    ) => {
      if ('elements' in formElement && Array.isArray(formElement.elements)) {
        memo.push({
          ...formElement,
          elements: injectDynamicElements(formElement.elements || []),
        })
        return memo
      }

      memo.push(formElement)

      switch (formElement.type) {
        case 'email': {
          if (formElement.requiresConfirmation) {
            const confirmationFormElementName =
              generateConfirmationFormElementName(formElement)

            memo.push({
              ...formElement,
              id: confirmationFormElementName,
              name: confirmationFormElementName,
              label: `Confirm ${formElement.label}`,
              isDataLookup: false,
              isElementLookup: false,
              defaultValue: undefined,
              hint: undefined,
              hintPosition: undefined,
              requiresConfirmation: false,
              isDynamicElement: true,
            })
          }
        }
      }

      return memo
    },
    [],
  )
}

export const removeDynamicElements = (
  formElements: FormElementWithDynamicElement[],
) => {
  return formElements.reduce<FormTypes.FormElement[]>((memo, formElement) => {
    if ('elements' in formElement && Array.isArray(formElement.elements)) {
      memo.push({
        ...formElement,
        elements: removeDynamicElements(formElement.elements || []),
      })
      return memo
    }
    if (!isDynamicElement(formElement)) {
      memo.push(formElement)
    }
    return memo
  }, [])
}
