import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export default function useFormElementOptions<T>({
  element,
  value,
  onChange,
  conditionallyShownOptions,
  onFilter,
}: {
  element: FormTypes.FormElementWithOptions
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<T>
  conditionallyShownOptions: FormTypes.ChoiceElementOption[] | undefined
  onFilter?: (choiceElementOption: FormTypes.ChoiceElementOption) => boolean
}) {
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    if (!element.options) {
      return []
    }
    if (!conditionallyShownOptions && !onFilter) {
      return element.options
    }
    return element.options.filter((option) => {
      return (
        (!conditionallyShownOptions ||
          conditionallyShownOptions.some(({ id }) => id === option.id)) &&
        (!onFilter || onFilter(option))
      )
    })
  }, [conditionallyShownOptions, element.options, onFilter])

  React.useEffect(() => {
    if (!element.options) {
      return
    }

    if (
      typeof value === 'string' &&
      value &&
      !filteredOptions.some((option) => value === option.value)
    ) {
      onChange(element, undefined)
      return
    }

    if (Array.isArray(value)) {
      const newValue = value.filter((selectedValue) =>
        filteredOptions.some((option) => selectedValue === option.value),
      )
      if (newValue.length !== value.length) {
        const newValueArray = newValue.length ? newValue : undefined
        onChange(element, newValueArray as T | undefined)
      }
    }
  }, [element, filteredOptions, onChange, value])

  return filteredOptions
}
