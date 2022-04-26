import { useMemo } from 'react'
import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import { FormTypes } from '@oneblink/types'

export const legacyNameRegex = /[^a-zA-Z\d_-]/

const checkStorageType = (element: FormTypes.FormElement) => {
  const storageElement = typeCastService.formElements.toStorageElement(element)
  if (
    storageElement &&
    (!storageElement.storageType || storageElement.storageType === 'legacy')
  ) {
    return {
      label: storageElement.label,
      name: storageElement.name,
      id: storageElement.id,
    }
  }
}

const checkName = (element: FormTypes.FormElement) => {
  const namedElement: FormTypes.FormElementWithName | undefined =
    typeCastService.formElements.toNamedElement(element)
  if (!!namedElement && legacyNameRegex.test(namedElement.name)) {
    const formElementWithoutForm =
      typeCastService.formElements.toFormElementWithoutForm(namedElement)
    return {
      name: namedElement.name,
      label: formElementWithoutForm?.label || 'Nested Form',
      id: namedElement.id,
    }
  }
}

const useLegacyFormElements = (formElements: FormTypes.FormElement[]) => {
  return useMemo(() => {
    const formElementsUsingLegacyStorage: Array<{
      name: string
      label: string
      id: string
    }> = []
    const formElementsUsingLegacyNames: Array<{
      name: string
      label: string
      id: string
    }> = []
    formElementsService.forEachFormElement(formElements || [], (element) => {
      const legacyStorageType = checkStorageType(element)
      if (legacyStorageType) {
        formElementsUsingLegacyStorage.push(legacyStorageType)
      }

      const legacyName = checkName(element)
      if (legacyName) {
        formElementsUsingLegacyNames.push(legacyName)
      }
    })
    return {
      formElementsUsingLegacyStorage,
      formElementsUsingLegacyNames,
    }
  }, [formElements])
}

export default useLegacyFormElements

const formElementLegacyConfigMessage =
  'Element is using unsupported configuration'
export const useFormElementLegacyConfigMessage = (
  formElement: FormTypes.FormElement,
) => {
  return useMemo<string | undefined>(() => {
    if (checkStorageType(formElement) || checkName(formElement)) {
      return formElementLegacyConfigMessage
    }
  }, [formElement])
}
