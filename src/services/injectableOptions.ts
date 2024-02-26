import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import { localisationService } from '@oneblink/apps'
import { v4 as uuidv4 } from 'uuid'
import { MiscTypes } from '@oneblink/types'
import { TaskContext } from '../hooks/useTaskContext'

type Option = Pick<FormTypes.ChoiceElementOption, 'value' | 'label'>

type Match = Map<string, Match | undefined>

function groupElementNames(memo: Match, rootElementNames: string[]): Match {
  const [repeatableSetElementName, ...elementNames] = rootElementNames
  if (elementNames.length) {
    const currentMap = memo.get(repeatableSetElementName)
    memo.set(
      repeatableSetElementName,
      groupElementNames(
        currentMap instanceof Map ? currentMap : new Map(),
        elementNames,
      ),
    )
  } else {
    memo.set(repeatableSetElementName, undefined)
  }

  return memo
}

function getNestedElementMatches(option: Option) {
  const matches: Match = new Map()
  formElementsService.matchElementsTagRegex(
    {
      text: option.label + ' ' + option.value,
      excludeNestedElements: false,
    },
    ({ elementName }) => {
      groupElementNames(matches, elementName.split('|'))
    },
  )
  return matches
}

function processInjectableDynamicOption({
  option,
  submission,
  formElements,
  ...params
}: {
  option: Option
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElements: FormTypes.FormElement[]
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): Map<string, string> {
  // Replace root level form element values
  const replaceableParams: Parameters<
    typeof localisationService.replaceInjectablesWithElementValues
  >[1] = {
    ...params,
    submission,
    formElements,
    task: params.taskContext.task,
    taskGroup: params.taskContext.taskGroup,
    taskGroupInstance: params.taskContext.taskGroupInstance,
    excludeNestedElements: true,
  }
  const label = localisationService.replaceInjectablesWithElementValues(
    option.label,
    replaceableParams,
  )
  const value = localisationService.replaceInjectablesWithElementValues(
    option.value,
    replaceableParams,
  )

  const newOptions: Map<string, string> = new Map()

  // Find nested form elements
  const matches = getNestedElementMatches({
    label,
    value,
  })

  if (matches.size) {
    matches.forEach((match, repeatableSetElementName) => {
      if (match instanceof Map && match.size) {
        // Attempt to create a new option for each entry in the repeatable set.
        const entries = submission?.[repeatableSetElementName]
        if (Array.isArray(entries)) {
          const repeatableSetElement = formElementsService.findFormElement(
            formElements,
            (formElement) => {
              return (
                'name' in formElement &&
                formElement.name === repeatableSetElementName
              )
            },
          )
          if (
            repeatableSetElement &&
            'elements' in repeatableSetElement &&
            Array.isArray(repeatableSetElement.elements)
          ) {
            for (const entry of entries) {
              const nestedOptions = processInjectableDynamicOption({
                ...params,
                option: {
                  label: label.replaceAll(
                    `{ELEMENT:${repeatableSetElementName}|`,
                    '{ELEMENT:',
                  ),
                  value: value.replaceAll(
                    `{ELEMENT:${repeatableSetElementName}|`,
                    '{ELEMENT:',
                  ),
                },
                submission: entry,
                formElements: repeatableSetElement.elements,
              })
              if (nestedOptions.size) {
                nestedOptions.forEach((nestedLabel, nestedValue) => {
                  if (!newOptions.has(nestedValue)) {
                    newOptions.set(nestedValue, nestedLabel)
                  }
                })
              }
            }
          }
        }
      }
    })
  } else {
    newOptions.set(value, label)
  }

  return newOptions
}

export default function processInjectableOption({
  option,
  submission,
  formElements,
  taskContext,
  userProfile,
}: {
  option: FormTypes.ChoiceElementOption
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElements: FormTypes.FormElement[]
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.ChoiceElementOption[] {
  const options = processInjectableDynamicOption({
    option,
    submission,
    formElements,
    taskContext,
    userProfile,
  })

  const generatedOptions: FormTypes.ChoiceElementOption[] = []

  options.forEach((label, value) => {
    generatedOptions.push({
      ...option,
      id: options.size === 1 ? option.id : uuidv4(),
      label,
      value,
    })
  })

  return generatedOptions
}

export const injectOptionsAcrossAllElements = ({
  elements,
  submission,
  taskContext,
  userProfile,
}: {
  elements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.FormElement[] => {
  return elements.map<FormTypes.FormElement>((e) => {
    switch (e.type) {
      case 'repeatableSet':
      case 'page':
      case 'section':
      case 'form': {
        return {
          ...e,
          elements: injectOptionsAcrossAllElements({
            elements: e.elements ?? [],
            submission,
            taskContext,
            userProfile,
          }),
        } as FormTypes.FormElement
      }
      default: {
        const optionsElement = typeCastService.formElements.toOptionsElement(e)
        if (optionsElement) {
          return {
            ...optionsElement,
            options: optionsElement.options?.reduce<
              FormTypes.ChoiceElementOption[]
            >((newOptions, o) => {
              const injected = processInjectableOption({
                option: o,
                submission,
                formElements: elements,
                taskContext,
                userProfile,
              })
              newOptions.push(...injected)
              return newOptions
            }, []),
          }
        }
        return e
      }
    }
  })
}
