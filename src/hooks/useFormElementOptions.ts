import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import { FormElementValueChangeHandler } from '../types/form'

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
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(
    () => shownOptions.filter((option) => !onFilter || onFilter(option)),
    [shownOptions, onFilter],
  )

  React.useEffect(() => {
    if (!element.options) {
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
  }, [element, shownOptions, onChange, value])

  return filteredOptions
}
