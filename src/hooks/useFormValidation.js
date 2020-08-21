// @flow
'use strict'

import * as React from 'react'

import {
  validatePages,
  generateSchemasByPages,
} from '../services/form-validation'

export default function useFormValidation(pages /* : PageElement[] */) {
  const [
    elementIdsWithLookupsExecuted,
    setElementIdsWithLookupsExecuted,
  ] = React.useState([])

  const executedLookup = React.useCallback((
    element /* : LookupFormElement */,
  ) => {
    setElementIdsWithLookupsExecuted((currentElementIdsWithLookupsExecuted) => {
      if (currentElementIdsWithLookupsExecuted.includes(element.id)) {
        return currentElementIdsWithLookupsExecuted
      }
      return [...currentElementIdsWithLookupsExecuted, element.id]
    })
  }, [])
  const executeLookupFailed = React.useCallback((
    element /* : LookupFormElement */,
  ) => {
    setElementIdsWithLookupsExecuted((currentElementIdsWithLookupsExecuted) => {
      return currentElementIdsWithLookupsExecuted.filter(
        (elementId) => elementId !== element.id,
      )
    })
  }, [])

  const schemaByPageId = React.useMemo(() => {
    return generateSchemasByPages(pages, elementIdsWithLookupsExecuted)
  }, [pages, elementIdsWithLookupsExecuted])

  const handleValidate = React.useCallback(
    (
      submission /* : $PropertyType<FormElementsCtrl, 'model'> */,
      pageElementsConditionallyShown /* : PageElementsConditionallyShown */,
    ) => {
      const pagesValidation = validatePages(
        schemaByPageId,
        submission,
        pageElementsConditionallyShown,
      )

      return {
        pagesValidation: pagesValidation,
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
