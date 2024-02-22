import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { formElementsService } from '@oneblink/sdk-core'

import { localisationService, authService } from '@oneblink/apps'
import { v4 as uuidv4 } from 'uuid'
import { matchElementsTagRegex } from '@oneblink/sdk-core/dist/formElementsService'

type MatchesResult = {
  elementPaths: string[][]
  text: string
}

const processInjectableOption = ({
  option,
  submission,
  formElements,
}: {
  option: FormTypes.ChoiceElementOption
  submission: SubmissionTypes.S3SubmissionData['submission']
  formElements: FormTypes.FormElement[]
}): FormTypes.ChoiceElementOption[] => {
  const labelMatchResult = getMatches(option.label)
  const valueMatchResult = getMatches(option.value)
  if (!labelMatchResult || !valueMatchResult) {
    return []
  }

  // References to elements in repeatable sets, must be sourced from the same repeatable set
  const repeatableSetRefsInLabel = labelMatchResult.elementPaths.filter(
    (path) => path.length > 1,
  )
  const repeatableSetRefsInValue = labelMatchResult.elementPaths.filter(
    (path) => path.length > 1,
  )
  const allRepeatableSetRefs = [
    ...repeatableSetRefsInLabel,
    ...repeatableSetRefsInValue,
  ]

  if (
    // Multiple repeatable set refs in our option def
    allRepeatableSetRefs.length > 1 &&
    // Every ref does NOT refer to an element inside a common repeatable set context
    !allRepeatableSetRefs.every((setRef) =>
      setRef
        .slice(0, -1)
        .every((v, i) => v === allRepeatableSetRefs[0].slice(0, -1)[i]),
    )
  ) {
    console.warn(
      'An injected option had a reference to 2 or more separate repeatable sets. This is not supported and therefore no options will be generated for it.',
    )
    return []
  }

  const repeatableSetRef = allRepeatableSetRefs[0] as string[] | undefined

  const repeatableSetEntries = !repeatableSetRef
    ? undefined
    : getRepeatableSetEntries(repeatableSetRef.slice(0, -1), submission)

  const repeatableSetElement = !repeatableSetRef
    ? undefined
    : (formElementsService.findFormElement(
        formElements,
        (e) =>
          e.type === 'repeatableSet' &&
          e.name === repeatableSetRef.reverse()[1],
      ) as FormTypes.RepeatableSetElement)
  return generateInjectedOptions({
    label: labelMatchResult,
    value: valueMatchResult,
    option,
    rootFormElements: formElements,
    repeatableSetEntries,
    repeatableSetFormElements: repeatableSetElement?.elements ?? [],
    submission,
  })
}
export default processInjectableOption

const getMatches = (text: string) => {
  const elementPaths: string[][] = []
  let nextText = text

  matchElementsTagRegex(text, ({ elementMatch, elementName }) => {
    const elementPath = elementName.split('|')
    elementPaths.push(elementPath)
    // Need to replace the repeatable set injectables with this,
    // so they are not picked up when we replace the submission values at the root level.
    // They will then be set back as they should to be replaced.
    if (elementPath.length > 1) {
      nextText = nextText.replace(
        elementMatch,
        `{ELEMENT_NESTED:${elementMatch.split('{ELEMENT:')[1]}`,
      )
    }
  })

  return { elementPaths, text: nextText }
}

const generateInjectedOptions = ({
  rootFormElements,
  repeatableSetFormElements,
  option,
  label,
  value,
  submission,
  repeatableSetEntries,
}: {
  rootFormElements: FormTypes.FormElement[]
  repeatableSetFormElements: FormTypes.FormElement[]
  option: FormTypes.ChoiceElementOption
  label: MatchesResult
  value: MatchesResult
  submission: SubmissionTypes.S3SubmissionData['submission']
  repeatableSetEntries: unknown[] | undefined
}) => {
  const iterableEntries = repeatableSetEntries ?? [{}]
  return iterableEntries.reduce<FormTypes.ChoiceElementOption[]>(
    (generatedOptions, entry) => {
      if (typeof entry === 'object' && !!entry && !Array.isArray(entry)) {
        const commonReplaceableParams = {
          userProfile: authService.getUserProfile() || undefined,
          task: undefined,
          taskGroup: undefined,
          taskGroupInstance: undefined,
        }

        // Replace any root level elements first
        let replacedLabel =
          localisationService.replaceInjectablesWithElementValues(label.text, {
            submission,
            formElements: rootFormElements,
            ...commonReplaceableParams,
          })
        let replacedValue =
          localisationService.replaceInjectablesWithElementValues(value.text, {
            submission,
            formElements: rootFormElements,
            ...commonReplaceableParams,
          })

        replacedLabel = replacedLabel.replaceAll(
          '{ELEMENT_NESTED:',
          '{ELEMENT:',
        )
        replacedValue = replacedValue.replaceAll(
          '{ELEMENT_NESTED:',
          '{ELEMENT:',
        )

        matchElementsTagRegex(
          replacedLabel,
          ({ elementMatch, elementName }) => {
            const elementPath = elementName.split('|')
            // Replace as though the repeatable set elements are root elements
            replacedLabel = replacedLabel.replace(
              elementMatch,
              `{ELEMENT:${elementPath[elementPath.length - 1]}}`,
            )
          },
        )
        matchElementsTagRegex(
          replacedValue,
          ({ elementMatch, elementName }) => {
            const elementPath = elementName.split('|')
            // Replace as though the repeatable set elements are root elements
            replacedValue = replacedValue.replace(
              elementMatch,
              `{ELEMENT:${elementPath[elementPath.length - 1]}}`,
            )
          },
        )

        // At last, replace the repeatable set values
        replacedLabel = localisationService.replaceInjectablesWithElementValues(
          replacedLabel,
          {
            submission: entry as SubmissionTypes.S3SubmissionData['submission'],
            formElements: repeatableSetFormElements,
            ...commonReplaceableParams,
          },
        )
        replacedValue = localisationService.replaceInjectablesWithElementValues(
          replacedValue,
          {
            submission: entry as SubmissionTypes.S3SubmissionData['submission'],
            formElements: repeatableSetFormElements,
            ...commonReplaceableParams,
          },
        )
        generatedOptions.push({
          ...option,
          id: iterableEntries.length === 1 ? option.id : uuidv4(),
          label: replacedLabel,
          value: replacedValue,
        })
      }
      return generatedOptions
    },
    [],
  )
}

const getRepeatableSetEntries = (
  path: string[],
  submission: SubmissionTypes.S3SubmissionData['submission'],
): undefined | unknown[] => {
  const entries = path.reduce<undefined | unknown>(
    (submissionValue, property: string) => {
      if (Array.isArray(submissionValue)) {
        return flattenSetEntries(submissionValue, property)
      }

      const nextValue =
        typeof submissionValue === 'object' && !!submissionValue
          ? (submissionValue as SubmissionTypes.S3SubmissionData['submission'])[
              property
            ]
          : undefined
      return nextValue
    },
    submission,
  )
  return Array.isArray(entries) ? entries : undefined
}

const flattenSetEntries = (
  submissionValue: Array<unknown>,
  property?: string,
) => {
  const entryValues: unknown[] = []
  for (const valueContext of submissionValue) {
    // If valueContext is an array of repeatable set entries
    if (Array.isArray(valueContext)) {
      entryValues.push(...flattenSetEntries(valueContext, property))
      // If valueContext is a repeatable set entry
    } else if (typeof valueContext === 'object' && !!valueContext) {
      const v = property
        ? (valueContext as Record<string, unknown>)[property]
        : valueContext
      if (Array.isArray(v)) {
        // We do not pass `property` because it has already been used
        // and we do not want to to try and find it at the next level
        entryValues.push(...flattenSetEntries(v))
      } else {
        entryValues.push(v)
      }
    }
  }
  return entryValues
}
