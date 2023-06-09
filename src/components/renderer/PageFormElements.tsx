import * as React from 'react'
import clsx from 'clsx'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import OneBlinkFormElements from './OneBlinkFormElements'
import useFormDefinition from '../../hooks/useFormDefinition'
import {
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValueChangeHandler,
  SetFormSubmission,
} from '../../types/form'
import { IsPageVisibleProvider } from '../../hooks/useIsPageVisible'
import { FlatpickrGuidProvider } from '../../hooks/useFlatpickrGuid'

export type Props = {
  formId: number
  isActive: boolean
  pageElement: FormTypes.PageElement
  displayValidationMessages: boolean
  model: SubmissionTypes.S3SubmissionData['submission']
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  onChange: FormElementValueChangeHandler
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
        const { submission, elements } = mergeLookupResults({
          elements: pageElement.elements,
          submission: currentFormSubmission.submission,
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
        })

        const definition = {
          ...currentFormSubmission.definition,
        }
        if (pageElement.id === formId.toString()) {
          definition.elements = elements
        } else {
          definition.elements = currentFormSubmission.definition.elements.map(
            (formElement) => {
              if (
                formElement.id === pageElement.id &&
                formElement.type === 'page'
              ) {
                return {
                  ...formElement,
                  elements,
                }
              } else {
                return formElement
              }
            },
          )
        }

        return {
          submission,
          definition,
          lastElementUpdated: currentFormSubmission.lastElementUpdated,
        }
      })
    },
    [formId, pageElement.elements, pageElement.id, setFormSubmission],
  )

  const form = useFormDefinition()

  return (
    <IsPageVisibleProvider isPageVisible={isActive}>
      <FlatpickrGuidProvider>
        <div
          key={pageElement.id}
          className={clsx('ob-page step-content is-active cypress-page', {
            'is-invisible': !isActive,
          })}
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
            idPrefix=""
          />
        </div>
      </FlatpickrGuidProvider>
    </IsPageVisibleProvider>
  )
}

export default React.memo(PageFormElements)
