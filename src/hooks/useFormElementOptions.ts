import { FormTypes } from '@oneblink/types'
import * as React from 'react'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  UpdateFormElementsHandler,
} from '../types/form'
import { useLoadDynamicOptionsEffect } from './useDynamicOptionsLoaderState'
import useFormSubmissionModel from './useFormSubmissionModelContext'
import processInjectableOption from '../services/injectableOptions'
import useTaskContext from './useTaskContext'
import useAuth from './useAuth'

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
  const taskContext = useTaskContext()
  const { userProfile } = useAuth()

  const { formSubmissionModel, elements } = useFormSubmissionModel()
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

  //
  const withInjectedOptions = React.useMemo(() => {
    return shownOptions.reduce<FormTypes.ChoiceElementOption[]>(
      (memo, option) => {
        const newOptions = processInjectableOption({
          option,
          submission: formSubmissionModel,
          formElements: elements,
          taskContext,
          userProfile: userProfile ?? undefined,
        })
        memo.push(...newOptions)

        return memo
      },
      [],
    )
  }, [elements, formSubmissionModel, shownOptions, taskContext, userProfile])

  //options that are shown based on conditional logic and user input
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    const reducedOptions = withInjectedOptions.filter(
      (option) => !onFilter || (onFilter(option) && !option.displayAlways),
    )
    if (element.type === 'autocomplete') {
      const alwaysShownOptions = withInjectedOptions.filter(
        (option) => option.displayAlways,
      )
      reducedOptions.push(...alwaysShownOptions)
    }
    return reducedOptions
  }, [withInjectedOptions, element.type, onFilter])

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
      !withInjectedOptions.some((option) => value === option.value)
    ) {
      onChange(element, {
        value: undefined,
      })
      return
    }

    if (Array.isArray(value)) {
      const newValue = value.filter((selectedValue) =>
        withInjectedOptions.some((option) => selectedValue === option.value),
      )
      if (newValue.length !== value.length) {
        const newValueArray = newValue.length ? newValue : undefined
        onChange(element, {
          value: newValueArray as T | undefined,
        })
      }
    }
  }, [
    element,
    shownOptions,
    onChange,
    value,
    conditionallyShownOptionsElement?.dependencyIsLoading,
    withInjectedOptions,
  ])

  useLoadDynamicOptionsEffect(element, onUpdateFormElements)

  return filteredOptions
}
