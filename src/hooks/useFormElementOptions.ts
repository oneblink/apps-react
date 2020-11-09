import { FormTypes } from '@oneblink/types'
import * as React from 'react'

export default function useFormElementOptions({
  element,
  value,
  onChange,
  onFilter,
}: {
  element: FormTypes.FormElementWithOptions
  value: unknown | void
  onChange: (formElement: FormTypes.FormElement, value: unknown | void) => void
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
    }

    if (Array.isArray(value)) {
      const newValue = value.filter((selectedValue) =>
        filteredOptions.some((option) => selectedValue === option.value),
      )
      if (newValue.length !== value.length) {
        onChange(element, newValue.length ? newValue : undefined)
      }
    }
  }, [element, filteredOptions, onChange, value])

  return filteredOptions
}
