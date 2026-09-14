// This file houses logic related to dynamic elements
// (Our term for elements that are created exclusively by our logic for display on the client side).
// These elements are not part of the form definition or the stored form submission.

import { FormTypes } from '@oneblink/types'

export function generateConfirmationFormElementName(
  formElement: FormTypes.EmailElement,
) {
  return window.btoa(formElement.name)
}

/**
 * The element a dynamic element was generated from, or `undefined` for an
 * element that came from the form definition. Logic that needs to treat a
 * dynamic element like the element it belongs to can rely on this instead of
 * knowing which element types generate what.
 */
export function getGeneratedByFormElementId(
  formElement: FormTypes.FormElement,
): string | undefined {
  if (
    'generatedByFormElementId' in formElement &&
    typeof formElement.generatedByFormElementId === 'string'
  ) {
    return formElement.generatedByFormElementId
  }
}

export const injectDynamicElements = (
  formElements: FormTypes.FormElement[],
): FormTypes.FormElement[] => {
  return formElements.reduce<FormTypes.FormElement[]>((memo, formElement) => {
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

          const confirmationFormElement = {
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
            generatedByFormElementId: formElement.id,
          }
          memo.push(confirmationFormElement)
        }
      }
    }

    return memo
  }, [])
}
