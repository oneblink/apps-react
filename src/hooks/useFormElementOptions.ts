import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import { formElementsService } from '@oneblink/sdk-core'
import { localisationService, authService } from '@oneblink/apps'
import { v4 as uuidv4 } from 'uuid'
import {
  FormElementValueChangeHandler,
  FormElementConditionallyShownElement,
  UpdateFormElementsHandler,
} from '../types/form'
import { useLoadDynamicOptionsEffect } from './useDynamicOptionsLoaderState'
import useFormSubmissionModel from './useFormSubmissionModelContext'

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

  const replaceInjectables = React.useCallback(
    ({
      option,
      submission,
      formElements,
    }: {
      option: FormTypes.ChoiceElementOption
      submission: SubmissionTypes.S3SubmissionData['submission']
      formElements: FormTypes.FormElement[]
    }):
      | FormTypes.ChoiceElementOption
      | FormTypes.ChoiceElementOption[]
      | undefined => {
      // let _text = text
      // let _text = (' ' + text).slice(1)
      let isOptionsArray = false
      const arrayRegex = /^\[(.*)\]$/
      //if option is wrapped in square brackets it comes from a repeatable set
      if (arrayRegex.test(option.label) && arrayRegex.test(option.value)) {
        isOptionsArray = true
      }

      function getMatches(text: string) {
        const ElementWYSIWYGRegex = new RegExp(
          formElementsService.ElementWYSIWYGRegex,
        )
        const elementNames = new Set<string>()
        let matches
        let nextText = text
        while ((matches = ElementWYSIWYGRegex.exec(text)) !== null) {
          if (matches?.length < 3) {
            continue
          }

          const elementName = isOptionsArray
            ? matches[2].split('|')[0]
            : matches[2]
          //allow zero
          if (!submission[elementName] && submission[elementName] !== 0) {
            return undefined
          }
          elementNames.add(elementName)
          nextText = nextText.replace(
            matches[0],
            `{ELEMENT:${matches[2].split('|').slice(1).join('|')}}`,
          )
        }
        return { elementNames, text: nextText.replace(arrayRegex, '$1') }
      }

      const labelMatchResult = getMatches(option.label)
      const valueMatchResult = getMatches(option.value)

      if (!labelMatchResult || !valueMatchResult) {
        return
      }

      if (isOptionsArray) {
        // label and value must be sourced from the same repeatable set
        if (
          labelMatchResult.elementNames.size !== 1 &&
          valueMatchResult.elementNames.size !== 1 &&
          [...labelMatchResult.elementNames.values()].every((v) =>
            valueMatchResult.elementNames.has(v),
          )
        ) {
          return undefined
        }
        const [elementName] = Array.from(labelMatchResult.elementNames)
        const repeatableSetData = submission[elementName]
        const repeatableSetElement = formElements.find(
          (el) => el.type === 'repeatableSet' && el.name === elementName,
        )
        if (
          Array.isArray(repeatableSetData) &&
          repeatableSetElement?.type === 'repeatableSet' &&
          Array.isArray(repeatableSetElement.elements)
        ) {
          return (
            repeatableSetData
              .map((data) =>
                replaceInjectables({
                  option: {
                    ...option,
                    id: uuidv4(),
                    label: labelMatchResult.text,
                    value: valueMatchResult.text,
                  },
                  submission: data,
                  formElements: repeatableSetElement.elements,
                }),
              )
              //TODO handle mulitple levels of recursion
              .filter(
                (r) => r && !Array.isArray(r),
              ) as FormTypes.ChoiceElementOption[]
          )
        }
        return undefined
      }

      return {
        ...option,
        label: localisationService.replaceInjectablesWithElementValues(
          option.label,
          {
            submission,
            formElements,
            userProfile: authService.getUserProfile() || undefined,
            task: undefined,
            taskGroup: undefined,
            taskGroupInstance: undefined,
          },
        ),
        value: localisationService.replaceInjectablesWithElementValues(
          option.value,
          {
            submission,
            formElements,
            userProfile: authService.getUserProfile() || undefined,
            task: undefined,
            taskGroup: undefined,
            taskGroupInstance: undefined,
          },
        ),
      }
    },
    [],
  )

  //options that are shown based on conditional logic and user input
  const filteredOptions = React.useMemo<FormTypes.ChoiceElementOption[]>(() => {
    const reducedOptions = shownOptions.filter(
      (option) => !onFilter || (onFilter(option) && !option.displayAlways),
    )
    const injectedOptions = reducedOptions.reduce<
      FormTypes.ChoiceElementOption[]
    >((memo, option) => {
      //No replaceable stuff
      if (
        !formElementsService.ElementWYSIWYGRegex.test(option.label) &&
        !formElementsService.ElementWYSIWYGRegex.test(option.value)
      ) {
        memo.push(option)
        return memo
      }
      const newOption = replaceInjectables({
        option,
        submission: formSubmissionModel,
        formElements: elements,
      })

      if (newOption === undefined) {
        return memo
      }

      if (Array.isArray(newOption)) {
        for (let i = 0; i < newOption.length; i++) {
          memo.push(newOption[i])
        }
        return memo
      }
      if (newOption) {
        memo.push(newOption)
      }

      return memo
    }, [])

    if (element.type === 'autocomplete') {
      const alwaysShownOptions = shownOptions.filter(
        (option) => option.displayAlways,
      )
      injectedOptions.push(...alwaysShownOptions)
    }
    return injectedOptions
  }, [
    shownOptions,
    element.type,
    onFilter,
    replaceInjectables,
    formSubmissionModel,
    elements,
  ])

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
      onChange(element, {
        value: undefined,
      })
      return
    }

    if (Array.isArray(value)) {
      const newValue = value.filter((selectedValue) =>
        shownOptions.some((option) => selectedValue === option.value),
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
  ])

  useLoadDynamicOptionsEffect(element, onUpdateFormElements)

  return filteredOptions
}
