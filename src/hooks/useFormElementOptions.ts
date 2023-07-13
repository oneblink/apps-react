import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  UpdateFormElementsHandler,
} from '../types/form'
import { useLoadDynamicOptionsEffect } from './useDynamicOptionsLoaderState'

export default function useFormElementOptions<T>({
  element,
  value,
  onChange,
  conditionallyShownOptionsElement,
  onFilter,
  onUpdateFormElements,
}: {
  element: FormTypes.FormElementWithOptions
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<T>
  conditionallyShownOptionsElement:
    | FormElementConditionallyShownElement
    | undefined
  onFilter?: (choiceElementOption: FormTypes.ChoiceElementOption) => boolean
  onUpdateFormElements: UpdateFormElementsHandler
}) {
  const conditionallyShownOptions = conditionallyShownOptionsElement?.options
  //options that are shown due to conditional logic
  const shownOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    if (!element.options) {
      return []
    }
    if (!conditionallyShownOptions && !onFilter) {
      return element.options
    }
    return element.options.filter((option) => {
      return (
        !conditionallyShownOptions ||
        conditionallyShownOptions.some(({ id }) => id === option.id)
      )
    })
  }, [conditionallyShownOptions, element.options, onFilter])

  //options that are shown based on conditional logic and user input
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    const reducedOptions = shownOptions.filter(
      (option) => !onFilter || (onFilter(option) && !option.displayAlways),
    )
    if (element.type === 'autocomplete') {
      const alwaysShownOptions = shownOptions.filter(
        (option) => option.displayAlways,
      )
      reducedOptions.push(...alwaysShownOptions)
    }
    return reducedOptions
  }, [shownOptions, element.type, onFilter])

  React.useEffect(() => {
    if (
      !element.options ||
      conditionallyShownOptionsElement?.dependencyIsLoading
    ) {
      return
    }

    if (
      typeof value === 'string' &&
      value &&
      !shownOptions.some((option) => value === option.value)
    ) {
      onChange(element, undefined)
      return
    }

    if (Array.isArray(value)) {
      const newValue = value.filter((selectedValue) =>
        shownOptions.some((option) => selectedValue === option.value),
      )
      if (newValue.length !== value.length) {
        const newValueArray = newValue.length ? newValue : undefined
        onChange(element, newValueArray as T | undefined)
      }
    }
  }, [
    element,
    shownOptions,
    onChange,
    value,
    conditionallyShownOptionsElement?.dependencyIsLoading,
  ])

  useLoadDynamicOptionsEffect(element, onUpdateFormElements)

  return filteredOptions
}
