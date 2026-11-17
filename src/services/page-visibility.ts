import { FormTypes } from '@oneblink/types'

import { FormElementsConditionallyShown } from '../types/form'
import isElementHiddenForAudience from './isElementHiddenForAudience'

/**
 * Pages that are still part of the form for an audience. Conditionally hidden
 * pages are omitted. Pages hidden from the audience stay here so their
 * elements keep running, while navigation uses {@link getNavigablePages}.
 */
export function getRenderedPages(
  pages: FormTypes.PageElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
): FormTypes.PageElement[] {
  return pages.filter((pageElement) => {
    return !formElementsConditionallyShown?.[pageElement.id]?.isHidden
  })
}

/**
 * Pages the audience can open. A page with `isHidden` is left out for every
 * audience in `hiddenFrom`, or for every audience when `hiddenFrom` is omitted.
 */
export function getNavigablePages(
  pages: FormTypes.PageElement[],
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined,
  audience: FormTypes.FormElementHiddenFromAudience,
): FormTypes.PageElement[] {
  return getRenderedPages(pages, formElementsConditionallyShown).filter(
    (pageElement) => !isElementHiddenForAudience(pageElement, audience),
  )
}
