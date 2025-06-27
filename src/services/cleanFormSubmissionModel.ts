import {
  CivicaTypes,
  FormTypes,
  GeoscapeTypes,
  SubmissionTypes,
} from '@oneblink/types'
import { Value as ComplianceValue } from '../form-elements/FormElementCompliance'
import { FormElementsConditionallyShown } from '../types/form'
import { ENTRY_ID_PROPERTY_NAME } from './generate-default-data'

function cleanElementValue(
  submission: SubmissionTypes.S3SubmissionData['submission'],
  elements: FormTypes.FormElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
  captchaTokens: string[],
): SubmissionTypes.S3SubmissionData['submission'] {
  // Clear data from submission on fields that are hidden on visible pages
  return elements.reduce<SubmissionTypes.S3SubmissionData['submission']>(
    (model, element) => {
      switch (element.type) {
        // For content element types, we just need to set true for shown and false for hidden.
        // This is to allow renderers of the data to know when to show/hide the content
        case 'image':
        case 'heading':
        case 'html': {
          if (!formElementsConditionallyShown?.[element.name]?.isHidden) {
            model[element.name] = true
          }
          break
        }
        // Lookup buttons submission value is as follows:
        // `undefined` is it was hidden conditionally
        // `true` if the lookup ran without dependencies changed after
        // `false` if the lookup did not run or dependencies changed after it was run and it was not run again.
        case 'lookupButton': {
          if (!formElementsConditionallyShown?.[element.name]?.isHidden) {
            model[element.name] = !!submission[element.name]
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
            Array.isArray(value) &&
            value.some((attachment) => !!attachment.data)
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
          const hasBinaryData = !!value?.data
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
            | SubmissionTypes.S3SubmissionData['submission']
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
            | Array<SubmissionTypes.S3SubmissionData['submission']>
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

          // prevent empty objects being submitted
          let isEmpty = true
          for (const key in civicaNameRecord) {
            if (
              civicaNameRecord[key as keyof CivicaTypes.CivicaNameRecord] !==
              undefined
            ) {
              isEmpty = false
              break
            }
          }
          if (isEmpty) {
            break
          }

          const streetAddresses = civicaNameRecord.streetAddress?.map(
            (streetAddress) => {
              if (
                element.useGeoscapeAddressing &&
                typeof streetAddress.address1 === 'object'
              ) {
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
              return {
                ...streetAddress,
                [ENTRY_ID_PROPERTY_NAME]: undefined,
              }
            },
          )
          model[element.name] = {
            ...civicaNameRecord,
            streetAddress: streetAddresses,
          }
          break
        }
        case 'freshdeskDependentField': {
          if (
            formElementsConditionallyShown?.[element.name]?.isHidden ||
            !submission[element.name]
          ) {
            break
          }
          const value = submission[
            element.name
          ] as FormTypes.FreshdeskDependentFieldElementValue
          if (value?.category) {
            const newValue: FormTypes.FreshdeskDependentFieldElementValue = {
              category: value.category,
            }
            if (value?.subCategory) {
              newValue.subCategory = value?.subCategory
              if (value?.item) {
                newValue.item = value?.item
              }
            }
            model[element.name] = newValue
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
    },
    {},
  )
}

export default function cleanFormSubmissionModel(
  submission: SubmissionTypes.S3SubmissionData['submission'],
  elements: FormTypes.FormElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
): {
  model: SubmissionTypes.S3SubmissionData['submission']
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
