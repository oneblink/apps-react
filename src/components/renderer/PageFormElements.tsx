import * as React from 'react'
import clsx from 'clsx'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import OneBlinkFormElements from './OneBlinkFormElements'
import useFormDefinition from '../../hooks/useFormDefinition'
import {
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  NestedFormElementValueChangeHandler,
  SetFormSubmission,
  UpdateFormElementsHandler,
} from '../../types/form'
import { IsPageVisibleProvider } from '../../hooks/useIsPageVisible'

export type Props = {
  formId: number
  isActive: boolean
  pageElement: FormTypes.PageElement
  displayValidationMessages: boolean
  model: SubmissionTypes.S3SubmissionData['submission']
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  onChange: NestedFormElementValueChangeHandler
  setFormSubmission: SetFormSubmission
}

function PageFormElements({
  formId,
  isActive,
  pageElement,
  model,
  displayValidationMessages,
  formElementsConditionallyShown,
  formElementsValidation,
  onChange,
  setFormSubmission,
}: Props) {
  const handleLookup = React.useCallback<FormElementLookupHandler>(
    (mergeLookupResults) => {
      setFormSubmission((currentFormSubmission) => {
        if (pageElement.id === formId.toString()) {
          const { submission, elements, executedLookups } = mergeLookupResults({
            elements: currentFormSubmission.definition.elements,
            submission: currentFormSubmission.submission,
            lastElementUpdated: currentFormSubmission.lastElementUpdated,
            executedLookups: currentFormSubmission.executedLookups,
          })

          return {
            submission,
            definition: {
              ...currentFormSubmission.definition,
              elements: elements,
            },
            lastElementUpdated: currentFormSubmission.lastElementUpdated,
            executedLookups,
          }
        }

        return currentFormSubmission.definition.elements.reduce<
          typeof currentFormSubmission
        >(
          (memo: typeof currentFormSubmission, formElement) => {
            if (
              formElement.id === pageElement.id &&
              formElement.type === 'page'
            ) {
              const { submission, executedLookups, elements } =
                mergeLookupResults({
                  elements: formElement.elements,
                  submission: currentFormSubmission.submission,
                  lastElementUpdated: currentFormSubmission.lastElementUpdated,
                  executedLookups: currentFormSubmission.executedLookups,
                })
              memo.submission = submission
              memo.executedLookups = executedLookups
              memo.definition.elements.push({
                ...formElement,
                elements,
              })
            } else {
              memo.definition.elements.push(formElement)
            }

            return memo
          },
          {
            ...currentFormSubmission,
            definition: {
              ...currentFormSubmission.definition,
              elements: [],
            },
          },
        )
      })
    },
    [formId, pageElement.id, setFormSubmission],
  )

  const form = useFormDefinition()

  const handleUpdateFormElements = React.useCallback<UpdateFormElementsHandler>(
    (updateFormElements) => {
      setFormSubmission((currentFormSubmission) => {
        const definition = {
          ...currentFormSubmission.definition,
        }

        if (pageElement.id === formId.toString()) {
          definition.elements = updateFormElements(
            currentFormSubmission.definition.elements,
          )
        } else {
          definition.elements = currentFormSubmission.definition.elements.map(
            (formElement) => {
              if (
                formElement.id === pageElement.id &&
                formElement.type === 'page'
              ) {
                return {
                  ...formElement,
                  elements: updateFormElements(formElement.elements),
                }
              } else {
                return formElement
              }
            },
          )
        }

        return {
          ...currentFormSubmission,
          definition,
        }
      })
    },
    [formId, pageElement.id, setFormSubmission],
  )

  return (
    <IsPageVisibleProvider isPageVisible={isActive}>
      <div>
        <div
          id={pageElement.id}
          key={pageElement.id}
          className={clsx('ob-page step-content is-active cypress-page', {
            'is-invisible': !isActive,
          })}
          aria-labelledby={`steps-navigation-step-label-${pageElement.id}`}
          role="region"
        >
          <OneBlinkFormElements
            formId={formId}
            model={model}
            parentElement={form}
            formElementsConditionallyShown={formElementsConditionallyShown}
            formElementsValidation={formElementsValidation}
            displayValidationMessages={displayValidationMessages}
            elements={pageElement.elements}
            onChange={onChange}
            onLookup={handleLookup}
            onUpdateFormElements={handleUpdateFormElements}
            idPrefix=""
          />
        </div>
      </div>
    </IsPageVisibleProvider>
  )
}

export default React.memo(PageFormElements)
