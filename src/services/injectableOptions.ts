import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { submissionService, typeCastService } from '@oneblink/sdk-core'
import { localisationService } from '@oneblink/apps'
import { v4 as uuidv4 } from 'uuid'
import { MiscTypes } from '@oneblink/types'
import { TaskContext } from '../hooks/useTaskContext'
type Option = Pick<FormTypes.ChoiceElementOption, 'value' | 'label'>

function processInjectableDynamicOption({
  option: resource,
  submission: rootSubmission,
  formElements: rootFormElements,
  contextElements,
  contextSubmission,
  ...params
}: {
  option: Option
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElements: FormTypes.FormElement[]
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
  contextElements?: FormTypes.FormElement[]
  contextSubmission?: {
    [name: string]: unknown
  }
}): Map<string, Option> {
  return submissionService.processInjectablesInCustomResource<Option>({
    resource,
    submission: rootSubmission,
    formElements: [...rootFormElements, ...(contextElements || [])],
    replaceRootInjectables(option, submission, formElements) {
      // Replace root level form element values
      const replaceableParams: Parameters<
        typeof localisationService.replaceInjectablesWithElementValues
      >[1] = {
        ...params,
        submission: { ...submission, ...contextSubmission },
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
        return
      }

      const {
        text: value,
        hadAllInjectablesReplaced: hadAllInjectablesReplacedInValue,
      } = localisationService.replaceInjectablesWithElementValues(
        option.value,
        replaceableParams,
      )
      if (!hadAllInjectablesReplacedInValue) {
        return
      }

      return [
        label + ' ' + value,
        value,
        {
          value,
          label,
        },
      ]
    },
    prepareNestedInjectables(option, prepare) {
      return {
        value: prepare(option.value),
        label: prepare(option.label),
      }
    },
  })
}

export default function processInjectableOption({
  option,
  submission,
  formElements,
  contextElements,
  contextSubmission,
  taskContext,
  userProfile,
}: {
  option: FormTypes.ChoiceElementOption
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElements: FormTypes.FormElement[]
  contextElements?: FormTypes.FormElement[]
  contextSubmission?: {
    [name: string]: unknown
  }
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.ChoiceElementOption[] {
  const options = processInjectableDynamicOption({
    option,
    submission,
    formElements,
    taskContext,
    userProfile,
    contextElements,
    contextSubmission,
  })

  const generatedOptions: FormTypes.ChoiceElementOption[] = []

  options.forEach(({ label, value }) => {
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
  contextElements,
  elements,
  entries,
  taskContext,
  userProfile,
}: {
  contextElements: FormTypes.FormElement[]
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
            // info elements on other pages/sections will need the parent definition
            contextElements,
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
              // sub-forms do not have context of parent elements
              contextElements: e.elements,
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
            // repeatable set entries may only know about elements within entry
            contextElements,
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
                    contextElements,
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
  contextElements: FormTypes.FormElement[]
  submission: SubmissionTypes.S3SubmissionData['submission']
  taskContext: TaskContext
  userProfile: MiscTypes.UserProfile | undefined
}): FormTypes.FormElement[] {
  // We iterate over entries as an array of submission objects because
  // child elements of a repeatable set that have injected options
  // need to include all of the injected options from the same elements
  // in sibling entries within the set. Otherwise we will not have the
  // labels for each available option to display the submission.
  return injectOptionsAcrossEntriesElements({
    ...params,
    entries: [submission],
  })
}
