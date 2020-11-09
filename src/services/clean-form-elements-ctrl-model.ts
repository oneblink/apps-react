import { FormTypes } from '@oneblink/types'

function cleanElementValue(
  element: FormTypes.FormElement,
  formElementsCtrl: FormElementsCtrl,
  formElementConditionallyShown: FormElementConditionallyShown | undefined,
  stripBinaryData: boolean,
  captchaTokens: string[],
) {
  const isShowing =
    !!formElementConditionallyShown && formElementConditionallyShown.isShown

  switch (element.type) {
    // For content element types, we just need to set true for shown and false for hidden.
    // This is to allow renderers of the data to know when to show/hide the content
    case 'image':
    case 'heading':
    case 'html': {
      return stripBinaryData ? undefined : isShowing
    }
    // Need to remove captcha tokens and save
    // them to POST them to the server for validation
    case 'captcha': {
      const token = formElementsCtrl.model[element.name]
      if (typeof token === 'string') {
        captchaTokens.push(token)
        return token
      }
      return undefined
    }
    case 'camera':
    case 'files':
    case 'file':
    case 'draw': {
      if (stripBinaryData || !isShowing) {
        return undefined
      } else {
        return formElementsCtrl.model[element.name]
      }
    }
    case 'infoPage':
    case 'form': {
      // Here we will check to make sure that each embedded form
      // also has its values wiped if the element is hidden based on conditional logic
      const nestedElements = element.elements
      const nestedModel = formElementsCtrl.model[
        element.name
      ] as FormElementsCtrl['model']
      if (
        isShowing &&
        Array.isArray(nestedElements) &&
        nestedElements.length &&
        nestedModel &&
        typeof nestedModel === 'object'
      ) {
        return nestedElements.reduce(
          (formModel: FormElementsCtrl['model'], e) => {
            if (e.type !== 'page') {
              formModel[e.name] = cleanElementValue(
                e,
                {
                  elements: nestedElements,
                  model: nestedModel,
                  parentFormElementsCtrl: formElementsCtrl,
                },
                formElementConditionallyShown &&
                  formElementConditionallyShown.type === 'nestedForm'
                  ? formElementConditionallyShown.nested &&
                      formElementConditionallyShown.nested[e.name]
                  : undefined,
                stripBinaryData,
                captchaTokens,
              )
            }
            return formModel
          },
          {},
        )
      }
      break
    }
    case 'repeatableSet': {
      // Here we will check to make sure that each repeatable set entry
      // also has its values wiped if the element is hidden based on conditional logic
      const nestedElements = element.elements
      const entries = formElementsCtrl.model[element.name]
      const formElementsConditionallyShownEntries =
        formElementConditionallyShown &&
        formElementConditionallyShown.type === 'repeatableSet'
          ? formElementConditionallyShown.entries
          : undefined
      if (
        isShowing &&
        Array.isArray(nestedElements) &&
        nestedElements.length &&
        Array.isArray(entries) &&
        entries.length
      ) {
        return entries.map((entry, index) => {
          const formElementsConditionallyShown = formElementsConditionallyShownEntries
            ? formElementsConditionallyShownEntries[index.toString()]
            : undefined
          return nestedElements.reduce(
            (entryModel: FormElementsCtrl['model'], e) => {
              if (e.type !== 'page' && entry && typeof entry === 'object') {
                entryModel[e.name] = cleanElementValue(
                  e,
                  {
                    elements: nestedElements,
                    model: entry,
                    parentFormElementsCtrl: formElementsCtrl,
                  },
                  formElementsConditionallyShown
                    ? formElementsConditionallyShown[e.name]
                    : undefined,
                  stripBinaryData,
                  captchaTokens,
                )
              }
              return entryModel
            },
            {},
          )
        })
      }
      break
    }
    case 'page': {
      break
    }
    default: {
      if (isShowing) {
        return formElementsCtrl.model[element.name]
      }
    }
  }
}

export default function cleanFormElementsCtrlModel(
  formElementsCtrl: FormElementsCtrl,
  formElementsConditionallyShown: FormElementsConditionallyShown,
  stripBinaryData: boolean,
) {
  const captchaTokens: string[] = []
  const model: { [property: string]: unknown } = {}

  // Clear data from submission on fields that are hidden on visible pages
  formElementsCtrl.elements.forEach((element) => {
    if (element.type !== 'page') {
      model[element.name] = cleanElementValue(
        element,
        formElementsCtrl,
        formElementsConditionallyShown &&
          formElementsConditionallyShown[element.name],
        stripBinaryData,
        captchaTokens,
      )
    }
  })

  return { model, captchaTokens }
}
