import { FormTypes } from '@oneblink/types'

import isElementHiddenForAudience from '../isElementHiddenForAudience'

function stripFormElementsWithoutName(
  formElements: FormTypes.FormElement[],
  hasReadOnlyAncestor: boolean,
): FormTypes.FormElementWithName[] {
  return formElements.reduce<FormTypes.FormElementWithName[]>(
    (memo, formElement) => {
      const isReadOnly =
        hasReadOnlyAncestor ||
        ('readOnly' in formElement && formElement.readOnly === true)

      switch (formElement.type) {
        case 'captcha': {
          // The renderer omits a captcha inside a read-only container, so
          // requiring one here would fail validation with an error the user
          // cannot see or resolve.
          if (isReadOnly) {
            return memo
          }
          return [...memo, formElement]
        }
        case 'page':
        case 'section': {
          return [
            ...memo,
            ...stripFormElementsWithoutName(formElement.elements, isReadOnly),
          ]
        }
        case 'infoPage':
        case 'form':
        case 'repeatableSet': {
          return [
            ...memo,
            {
              ...formElement,
              elements: stripFormElementsWithoutName(
                formElement.elements || [],
                isReadOnly,
              ),
            },
          ]
        }
        default: {
          return [...memo, formElement]
        }
      }
    },
    [],
  )
}

/**
 * Elements validated for an audience. Elements on a page that audience cannot
 * see are omitted, because that audience cannot resolve errors on them.
 */
export default function getFormElementsValidatedForAudience(
  pages: FormTypes.PageElement[],
  audience: FormTypes.FormElementHiddenFromAudience,
): FormTypes.FormElementWithName[] {
  const pagesVisibleToAudience = pages.filter(
    (page) => !isElementHiddenForAudience(page, audience),
  )
  return stripFormElementsWithoutName(pagesVisibleToAudience, false)
}
