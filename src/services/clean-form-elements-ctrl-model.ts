import { CivicaTypes, GeoscapeTypes } from '@oneblink/types'
import { Value as ComplianceValue } from '../form-elements/FormElementCompliance'

function cleanElementValue(
  formElementsCtrl: FormElementsCtrl,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
  captchaTokens: string[],
): FormElementsCtrl['model'] {
  // Clear data from submission on fields that are hidden on visible pages
  return formElementsCtrl.elements.reduce<FormElementsCtrl['model']>(
    (model, element) => {
      switch (element.type) {
        // For content element types, we just need to set true for shown and false for hidden.
        // This is to allow renderers of the data to know when to show/hide the content
        case 'image':
        case 'heading':
        case 'html': {
          if (
            !stripBinaryData &&
            formElementsConditionallyShown?.[element.name]?.isShown !== false
          ) {
            model[element.name] = true
          }
          break
        }
        // Need to remove captcha tokens and save
        // them to POST them to the server for validation
        case 'captcha': {
          const token = formElementsCtrl.model[element.name]
          if (typeof token === 'string') {
            captchaTokens.push(token)
            model[element.name] = token
          }
          break
        }
        case 'camera':
        case 'files':
        case 'file':
        case 'draw': {
          if (
            !stripBinaryData &&
            formElementsConditionallyShown?.[element.name]?.isShown !== false
          ) {
            model[element.name] = formElementsCtrl.model[element.name]
          }
          break
        }
        case 'infoPage':
        case 'form': {
          // Here we will check to make sure that each embedded form
          // also has its values wiped if the element is hidden based on conditional logic
          const nestedElements = element.elements
          const nestedModel = formElementsCtrl.model[element.name] as
            | FormElementsCtrl['model']
            | undefined
          const nestedFormElementConditionallyShown =
            formElementsConditionallyShown?.[element.name]
          if (
            formElementsConditionallyShown?.[element.name]?.isShown !== false &&
            Array.isArray(nestedElements) &&
            nestedElements.length &&
            nestedModel
          ) {
            model[element.name] = cleanElementValue(
              {
                elements: nestedElements,
                model: nestedModel,
                parentFormElementsCtrl: formElementsCtrl,
              },
              nestedFormElementConditionallyShown?.type === 'formElements'
                ? nestedFormElementConditionallyShown.formElements
                : undefined,
              stripBinaryData,
              captchaTokens,
            ).model
          }
          break
        }
        case 'repeatableSet': {
          // Here we will check to make sure that each repeatable set entry
          // also has its values wiped if the element is hidden based on conditional logic
          const nestedElements = element.elements
          const entries = formElementsCtrl.model[element.name] as
            | Array<FormElementsCtrl['model']>
            | undefined
          const formElementConditionallyShown =
            formElementsConditionallyShown?.[element.name]
          if (
            formElementConditionallyShown?.isShown !== false &&
            Array.isArray(nestedElements) &&
            Array.isArray(entries) &&
            entries.length
          ) {
            model[element.name] = entries.map((entry, index) => {
              return cleanElementValue(
                {
                  elements: nestedElements,
                  model: entry || {},
                  parentFormElementsCtrl: formElementsCtrl,
                },
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
          const civicaNameRecord = formElementsCtrl.model[element.name] as
            | CivicaTypes.CivicaNameRecord
            | undefined
          if (
            formElementsConditionallyShown?.[element.name]?.isShown === false ||
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
            formElementsConditionallyShown?.[element.name]?.isShown === false ||
            !formElementsCtrl.model[element.name]
          ) {
            break
          }
          if (stripBinaryData) {
            model[element.name] = {
              ...(formElementsCtrl.model[element.name] as ComplianceValue),
              files: undefined,
            }
          } else {
            model[element.name] = formElementsCtrl.model[element.name]
          }
          break
        }
        case 'page':
        case 'section': {
          break
        }
        default: {
          if (
            formElementsConditionallyShown?.[element.name]?.isShown !== false
          ) {
            model[element.name] = formElementsCtrl.model[element.name]
          }
        }
      }

      return model
    },
    {},
  )
}

export default function cleanFormElementsCtrlModel(
  formElementsCtrl: FormElementsCtrl,
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  stripBinaryData: boolean,
): {
  model: FormElementsCtrl['model']
  captchaTokens: string[]
} {
  // Clear data from submission on fields that are hidden on visible pages
  const captchaTokens: string[] = []
  const model = cleanElementValue(
    formElementsCtrl,
    formElementsConditionallyShown,
    stripBinaryData,
    captchaTokens,
  )
  return {
    model,
    captchaTokens,
  }
}
