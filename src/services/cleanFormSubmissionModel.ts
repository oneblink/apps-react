import { CivicaTypes, FormTypes, GeoscapeTypes } from '@oneblink/types'
import { Value as ComplianceValue } from '../form-elements/FormElementCompliance'
import {
  FormElementsConditionallyShown,
  FormSubmissionModel,
} from '../types/form'
import { checkIsUsingLegacyStorage } from './attachments'

function cleanElementValue(
  submission: FormSubmissionModel,
  elements: FormTypes.FormElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
  captchaTokens: string[],
): FormSubmissionModel {
  // Clear data from submission on fields that are hidden on visible pages
  return elements.reduce<FormSubmissionModel>((model, element) => {
    switch (element.type) {
      // For content element types, we just need to set true for shown and false for hidden.
      // This is to allow renderers of the data to know when to show/hide the content
      case 'image':
      case 'heading':
      case 'html': {
        if (
          !stripBinaryData &&
          !formElementsConditionallyShown?.[element.name]?.isHidden
        ) {
          model[element.name] = true
        }
        break
      }
      // Need to remove captcha tokens and save
      // them to POST them to the server for validation
      case 'captcha': {
        const token = submission[element.name]
        if (typeof token === 'string') {
          captchaTokens.push(token)
        }
        break
      }
      case 'files': {
        const value = submission[element.name] as
          | Array<Record<string, unknown>>
          | undefined
        const hasBinaryData =
          checkIsUsingLegacyStorage(element) ||
          (Array.isArray(value) &&
            value.some((attachment) => !!attachment.data))
        if (
          (!stripBinaryData || !hasBinaryData) &&
          !formElementsConditionallyShown?.[element.name]?.isHidden
        ) {
          model[element.name] = submission[element.name]
        }
        break
      }
      case 'camera':
      case 'draw': {
        const value = submission[element.name] as
          | Record<string, unknown>
          | undefined
        const hasBinaryData =
          checkIsUsingLegacyStorage(element) || !!value?.data
        if (
          (!stripBinaryData || !hasBinaryData) &&
          !formElementsConditionallyShown?.[element.name]?.isHidden
        ) {
          model[element.name] = submission[element.name]
        }
        break
      }
      case 'infoPage':
      case 'form': {
        // Here we will check to make sure that each embedded form
        // also has its values wiped if the element is hidden based on conditional logic
        const nestedElements = element.elements
        const nestedModel = submission[element.name] as
          | FormSubmissionModel
          | undefined
        const nestedFormElementConditionallyShown =
          formElementsConditionallyShown?.[element.name]
        if (
          !formElementsConditionallyShown?.[element.name]?.isHidden &&
          Array.isArray(nestedElements)
        ) {
          model[element.name] = cleanElementValue(
            nestedModel || {},
            nestedElements,
            nestedFormElementConditionallyShown?.type === 'formElements'
              ? nestedFormElementConditionallyShown.formElements
              : undefined,
            stripBinaryData,
            captchaTokens,
          )
        }
        break
      }
      case 'repeatableSet': {
        // Here we will check to make sure that each repeatable set entry
        // also has its values wiped if the element is hidden based on conditional logic
        const nestedElements = element.elements
        const entries = submission[element.name] as
          | Array<FormSubmissionModel>
          | undefined
        const formElementConditionallyShown =
          formElementsConditionallyShown?.[element.name]
        if (
          !formElementConditionallyShown?.isHidden &&
          Array.isArray(nestedElements) &&
          Array.isArray(entries) &&
          entries.length
        ) {
          model[element.name] = entries.map((entry, index) => {
            return cleanElementValue(
              entry || {},
              nestedElements,
              formElementConditionallyShown?.type === 'repeatableSet'
                ? formElementConditionallyShown.entries?.[index.toString()]
                : undefined,
              stripBinaryData,
              captchaTokens,
            )
          })
        }
        break
      }
      case 'civicaNameRecord': {
        const civicaNameRecord = submission[element.name] as
          | CivicaTypes.CivicaNameRecord
          | undefined
        if (
          formElementsConditionallyShown?.[element.name]?.isHidden ||
          !civicaNameRecord
        ) {
          break
        }

        for (const key in civicaNameRecord) {
          if (
            civicaNameRecord[key as keyof CivicaTypes.CivicaNameRecord] ===
            undefined
          ) {
            continue
          }

          if (
            !element.useGeoscapeAddressing ||
            !Array.isArray(civicaNameRecord.streetAddress)
          ) {
            model[element.name] = civicaNameRecord
            break
          }

          const streetAddresses = civicaNameRecord.streetAddress.map(
            (streetAddress) => {
              if (typeof streetAddress.address1 === 'object') {
                const geoscapeAddress = streetAddress.address1 as
                  | GeoscapeTypes.GeoscapeAddress
                  | undefined
                return {
                  address1: [
                    geoscapeAddress?.addressDetails?.streetNumber1,
                    geoscapeAddress?.addressDetails?.streetName,
                    geoscapeAddress?.addressDetails?.streetType,
                  ]
                    .filter((str) => !!str)
                    .join(' '),
                  address2: geoscapeAddress?.addressDetails?.localityName,
                  postcode: geoscapeAddress?.addressDetails?.postcode,
                }
              }
              return streetAddress
            },
          )
          model[element.name] = {
            ...civicaNameRecord,
            streetAddress: streetAddresses,
          }
        }
        break
      }
      case 'compliance': {
        if (
          formElementsConditionallyShown?.[element.name]?.isHidden ||
          !submission[element.name]
        ) {
          break
        }
        const checklistObject = submission[element.name] as ComplianceValue
        const notes = checklistObject?.notes?.trim()
        if (stripBinaryData) {
          model[element.name] = {
            ...checklistObject,
            notes: notes,
            files: undefined,
          }
        } else {
          model[element.name] = {
            ...checklistObject,
            notes: notes,
          }
        }
        break
      }
      case 'page':
      case 'section': {
        if (!formElementsConditionallyShown?.[element.id]?.isHidden) {
          const nestedModel = cleanElementValue(
            submission,
            element.elements,
            formElementsConditionallyShown,
            stripBinaryData,
            captchaTokens,
          )
          Object.assign(model, nestedModel)
        }
        break
      }
      default: {
        if (!formElementsConditionallyShown?.[element.name]?.isHidden) {
          const value = submission[element.name]
          switch (element.type) {
            case 'text':
            case 'textarea':
            case 'email':
            case 'barcodeScanner':
            case 'telephone': {
              model[element.name] =
                typeof value === 'string'
                  ? value.trim()
                  : submission[element.name]
              break
            }
            default: {
              model[element.name] = value
            }
          }
        }
      }
    }

    return model
  }, {})
}

export default function cleanFormSubmissionModel(
  submission: FormSubmissionModel,
  elements: FormTypes.FormElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
): {
  model: FormSubmissionModel
  captchaTokens: string[]
} {
  // Clear data from submission on fields that are hidden on visible pages
  const captchaTokens: string[] = []
  const model = cleanElementValue(
    submission,
    elements,
    formElementsConditionallyShown,
    stripBinaryData,
    captchaTokens,
  )
  return {
    model,
    captchaTokens,
  }
}
