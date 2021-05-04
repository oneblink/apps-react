import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export default function useFormElementOptions<T>({
  element,
  value,
  onChange,
  onFilter,
}: {
  element: FormTypes.FormElementWithOptions
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<T>
  onFilter: (choiceElementOption: FormTypes.ChoiceElementOption) => boolean
}) {
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    if (!element.options) {
      return []
    }
    return element.options.filter(onFilter)
  }, [element.options, onFilter])

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
