import { FormTypes } from '@oneblink/types'
import * as React from 'react'

import {
  validatePages,
  generateSchemasByPages,
} from '../services/form-validation'

export default function useFormValidation(pages: FormTypes.PageElement[]) {
  const [elementIdsWithLookupsExecuted, setElementIdsWithLookupsExecuted] =
    React.useState<string[]>([])

  const executedLookup = React.useCallback(
    (element: FormTypes.LookupFormElement) => {
      setElementIdsWithLookupsExecuted(
        (currentElementIdsWithLookupsExecuted: string[]) => {
          if (currentElementIdsWithLookupsExecuted.includes(element.id)) {
            return currentElementIdsWithLookupsExecuted
          }
          return [...currentElementIdsWithLookupsExecuted, element.id]
        },
      )
    },
    [],
  )
  const executeLookupFailed = React.useCallback(
    (element: FormTypes.LookupFormElement) => {
      setElementIdsWithLookupsExecuted(
        (currentElementIdsWithLookupsExecuted) => {
          return currentElementIdsWithLookupsExecuted.filter(
            (elementId) => elementId !== element.id,
          )
        },
      )
    },
    [],
  )

  const schemaByPageId = React.useMemo(() => {
    return generateSchemasByPages(pages, elementIdsWithLookupsExecuted)
  }, [pages, elementIdsWithLookupsExecuted])

  const handleValidate = React.useCallback(
    (
      submission: FormElementsCtrl['model'],
      pageElementsConditionallyShown: PageElementsConditionallyShown,
    ) => {
      const pagesValidation = validatePages(
        schemaByPageId,
        submission,
        pageElementsConditionallyShown,
      )
      return {
        pagesValidation,
      }
    },
    [schemaByPageId],
  )

  return {
    executedLookup,
    executeLookupFailed,
    validate: handleValidate,
  }
}
