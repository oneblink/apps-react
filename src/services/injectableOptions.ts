import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { formElementsService, typeCastService } from '@oneblink/sdk-core'
import { localisationService } from '@oneblink/apps'
import { v4 as uuidv4 } from 'uuid'
import { MiscTypes } from '@oneblink/types'
import { TaskContext } from '../hooks/useTaskContext'

type Option = Pick<FormTypes.ChoiceElementOption, 'value' | 'label'>

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
  const newOptions: Map<string, string> = new Map()

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
  const {
    text: label,
    hadAllInjectablesReplaced: hadAllInjectablesReplacedInLabel,
  } = localisationService.replaceInjectablesWithElementValues(
    option.label,
    replaceableParams,
  )
  if (!hadAllInjectablesReplacedInLabel) {
    return newOptions
  }

  const {
    text: value,
    hadAllInjectablesReplaced: hadAllInjectablesReplacedInValue,
  } = localisationService.replaceInjectablesWithElementValues(
    option.value,
    replaceableParams,
  )
  if (!hadAllInjectablesReplacedInValue) {
    return newOptions
  }

  // Find nested form elements
  const matches: Map<string, boolean> = new Map()
  formElementsService.matchElementsTagRegex(
    {
      text: label + ' ' + value,
      excludeNestedElements: false,
    },
    ({ elementName }) => {
      const [repeatableSetElementName, ...elementNames] = elementName.split('|')
      matches.set(repeatableSetElementName, !!elementNames.length)
    },
  )

  if (matches.size) {
    matches.forEach((hasNestedFormElements, repeatableSetElementName) => {
      if (hasNestedFormElements) {
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

function injectOptionsAcrossEntriesElements({
  elements,
  entries,
  taskContext,
  userProfile,
}: {
  elements: FormTypes.FormElement[]
  entries: SubmissionTypes.S3SubmissionData['submission'][]
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.FormElement[] {
  return elements.map<FormTypes.FormElement>((e) => {
    switch (e.type) {
      case 'page':
      case 'section': {
        return {
          ...e,
          elements: injectOptionsAcrossEntriesElements({
            elements: e.elements,
            entries,
            taskContext,
            userProfile,
          }),
        }
      }
      case 'form': {
        if (Array.isArray(e.elements)) {
          return {
            ...e,
            elements: injectOptionsAcrossEntriesElements({
              elements: e.elements,
              entries: entries.reduce<
                SubmissionTypes.S3SubmissionData['submission'][]
              >((memo, entry) => {
                if (entry[e.name]) {
                  memo.push(
                    entry[
                      e.name
                    ] as SubmissionTypes.S3SubmissionData['submission'],
                  )
                }
                return memo
              }, []),
              taskContext,
              userProfile,
            }),
          }
        } else {
          return e
        }
      }
      case 'repeatableSet': {
        return {
          ...e,
          elements: injectOptionsAcrossEntriesElements({
            elements: e.elements,
            entries: entries.reduce<
              SubmissionTypes.S3SubmissionData['submission'][]
            >((memo, entry) => {
              const nestedEntries = entry[e.name]
              if (Array.isArray(nestedEntries)) {
                memo.push(
                  ...(nestedEntries as SubmissionTypes.S3SubmissionData['submission'][]),
                )
              }
              return memo
            }, []),
            taskContext,
            userProfile,
          }),
        }
      }
      default: {
        const optionsElement = typeCastService.formElements.toOptionsElement(e)
        if (optionsElement) {
          return {
            ...optionsElement,
            options: entries.reduce<FormTypes.ChoiceElementOption[]>(
              (newOptions, submission) => {
                optionsElement.options?.forEach((o) => {
                  const injected = processInjectableOption({
                    option: o,
                    submission,
                    formElements: elements,
                    taskContext,
                    userProfile,
                  })

                  newOptions.push(
                    ...injected.filter((generatedOption) => {
                      return !newOptions.some(
                        (addedOption) =>
                          addedOption.value === generatedOption.value,
                      )
                    }),
                  )
                })
                return newOptions
              },
              [],
            ),
          }
        }
        return e
      }
    }
  })
}

export function injectOptionsAcrossAllElements({
  submission,
  ...params
}: {
  elements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.FormElement[] {
  // We iterate over entries as an array of submission objects because
  // elements with options within repeatable sets need to include all
  // of the options from each entry within the set. Otherwise we will
  // not have the labels for each available option to display the submission.
  return injectOptionsAcrossEntriesElements({
    ...params,
    entries: [submission],
  })
}
