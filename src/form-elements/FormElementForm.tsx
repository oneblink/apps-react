import { FormTypes, SubmissionTypes } from '@oneblink/types'
import * as React from 'react'
import OneBlinkFormElements from '../components/renderer/OneBlinkFormElements'
import {
  ExecutedLookups,
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementValidation,
  NestedFormElementValueChangeHandler,
  SectionState,
  UpdateFormElementsHandler,
} from '../types/form'
import ElementDOMId from '../utils/elementDOMIds'
import { recursivelySetReadOnly } from '../OneBlinkReadOnlyForm'

export type Props = {
  formId: number
  id: string
  element: FormTypes.FormFormElement
  value: SubmissionTypes.S3SubmissionData['submission'] | undefined
  onChange: NestedFormElementValueChangeHandler<
    SubmissionTypes.S3SubmissionData['submission']
  >
  onLookup: FormElementLookupHandler
  formElementValidation: FormElementValidation | undefined
  displayValidationMessages: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  onUpdateFormElements: UpdateFormElementsHandler
  sectionState: SectionState
}

function FormElementForm({
  formId,
  element,
  value,
  id,
  formElementValidation,
  displayValidationMessages,
  formElementConditionallyShown,
  onChange,
  onLookup,
  onUpdateFormElements,
  sectionState,
}: Props) {
  const handleNestedChange = React.useCallback(
    (
      nestedElement: FormTypes.FormElement,
      {
        value: nestedElementValue,
        executedLookups: nestedExecutedLookups,
        sectionState,
      }: Parameters<NestedFormElementValueChangeHandler>[1],
      idPrefix?: string,
    ) => {
      if (nestedElement.type === 'section') {
        // trigger onChange to update sectionState
        onChange(
          {
            ...nestedElement,
            id: idPrefix ? `${idPrefix}${nestedElement.id}` : nestedElement.id,
          },
          { executedLookups: undefined, sectionState },
        )
      }
      if (!('name' in nestedElement)) return
      onChange(element, {
        value: (existingValue) => ({
          ...existingValue,
          [nestedElement.name]:
            typeof nestedElementValue === 'function'
              ? nestedElementValue(
                  existingValue ? existingValue[nestedElement.name] : undefined,
                )
              : nestedElementValue,
        }),
        executedLookups: (existingExecutedLookups) => {
          if (
            typeof existingExecutedLookups === 'boolean' ||
            Array.isArray(existingExecutedLookups)
          ) {
            return {}
          }
          return {
            ...existingExecutedLookups,
            [nestedElement.name]:
              typeof nestedExecutedLookups === 'function'
                ? nestedExecutedLookups(
                    existingExecutedLookups?.[
                      nestedElement.name
                    ] as ExecutedLookups,
                  )
                : nestedExecutedLookups,
          }
        },
        sectionState,
      })
    },
    [element, onChange],
  )

  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      onLookup((currentFormSubmission) => {
        let model = currentFormSubmission.submission[
          element.name
        ] as SubmissionTypes.S3SubmissionData['submission']
        let newExecutedLookups = currentFormSubmission.executedLookups?.[
          element.name
        ] as ExecutedLookups

        const elements = currentFormSubmission.elements.map((formElement) => {
          if (
            formElement.type === 'form' &&
            formElement.name === element.name &&
            Array.isArray(formElement.elements)
          ) {
            const { elements, submission, executedLookups } =
              mergeLookupResults({
                elements: formElement.elements,
                submission: model,
                lastElementUpdated: currentFormSubmission.lastElementUpdated,
                executedLookups: newExecutedLookups,
                sectionState: currentFormSubmission.sectionState,
              })
            model = submission
            newExecutedLookups = executedLookups as ExecutedLookups
            return {
              ...formElement,
              elements,
            }
          }
          return formElement
        })

        const submission = {
          ...currentFormSubmission.submission,
          [element.name]: model,
        }

        return {
          elements,
          submission,
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
          executedLookups: {
            ...currentFormSubmission.executedLookups,
            [element.name]: newExecutedLookups,
          },
          sectionState: currentFormSubmission.sectionState,
        }
      })
    },
    [element.name, onLookup],
  )

  const validation = React.useMemo(() => {
    return !!formElementValidation &&
      typeof formElementValidation !== 'string' &&
      formElementValidation.type === 'formElements'
      ? formElementValidation.formElements
      : undefined
  }, [formElementValidation])

  const formElementsConditionallyShown = React.useMemo(() => {
    return formElementConditionallyShown &&
      formElementConditionallyShown.type === 'formElements'
      ? formElementConditionallyShown.formElements
      : undefined
  }, [formElementConditionallyShown])

  const parentElement = React.useMemo(() => {
    return {
      elements: Array.isArray(element.elements)
        ? element.readOnly
          ? recursivelySetReadOnly(element.elements)
          : element.elements
        : [],
    }
  }, [element.elements, element.readOnly])

  const handleUpdateNestedFormElements =
    React.useCallback<UpdateFormElementsHandler>(
      (setter) => {
        onUpdateFormElements((formElements) => {
          return formElements.map((formElement) => {
            if (
              formElement.id === element.id &&
              formElement.type === 'form' &&
              Array.isArray(formElement.elements)
            ) {
              return {
                ...formElement,
                elements: setter(formElement.elements),
              }
            }
            return formElement
          })
        })
      },
      [element.id, onUpdateFormElements],
    )

  const elementDOMId = React.useMemo(() => new ElementDOMId(id), [id])

  return (
    <OneBlinkFormElements
      formId={formId}
      formElementsValidation={validation}
      displayValidationMessages={displayValidationMessages}
      elements={parentElement.elements}
      onChange={handleNestedChange}
      onLookup={handleLookup}
      formElementsConditionallyShown={formElementsConditionallyShown}
      model={value || {}}
      parentElement={parentElement}
      idPrefix={elementDOMId.subFormDOMIdPrefix}
      onUpdateFormElements={handleUpdateNestedFormElements}
      sectionState={sectionState}
    />
  )
}

export default React.memo(FormElementForm)
