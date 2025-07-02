import React, { memo, useCallback, useContext, useEffect, useMemo } from 'react'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import {
  FormElementLookupHandler,
  FormElementValueChangeHandler,
  IsDirtyProps,
} from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import LookupNotification from '../components/renderer/LookupNotification'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import { formElementsService } from '@oneblink/sdk-core'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type ValidationMessageProps = {
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

type Props = {
  id: string
  element: FormTypes.LookupButtonFormElement
} & ValidationMessageProps

function stringifyLookupButtonValue(v: unknown): string {
  return JSON.stringify(v) as string
}

const FormElementLookupButtonValidationMessage = memo(
  function _FormElementLookupButtonValidationMessage({
    validationMessage,
    displayValidationMessage,
    isDirty,
  }: ValidationMessageProps) {
    const { isLookingUp } = useContext(LookupNotificationContext)
    const isDisplayingValidationMessage =
      (isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLookingUp

    if (!isDisplayingValidationMessage) {
      return null
    }

    return <FormElementValidationMessage message={validationMessage} />
  },
)

function FormElementLookupButton({
  id,
  element,
  onChange,
  onLookup,
  ...validationMessageProps
}: Props & {
  onChange: FormElementValueChangeHandler
  onLookup: FormElementLookupHandler
}) {
  const { formSubmissionModel, elements } = useFormSubmissionModel()
  const { isAutoLookup, data } = useMemo(() => {
    return generateLookupButtonValue(
      element.elementDependencies,
      elements,
      formSubmissionModel,
    )
  }, [element.elementDependencies, elements, formSubmissionModel])

  const handleLookup = useCallback<FormElementLookupHandler>(
    (setter) => {
      onLookup((data) => {
        const dataAfterSetting = setter(data)
        dataAfterSetting.submission[element.name] = true
        return dataAfterSetting
      })
    },
    [element.name, onLookup],
  )

  const stringifyData = useMemo(() => {
    if (!data) {
      return undefined
    }
    return stringifyLookupButtonValue(data)
  }, [data])

  useEffect(() => {
    onChange(element, {
      value: false,
    })
  }, [element, onChange, stringifyData])

  const value = useMemo(() => {
    // Want the value to be `true` if there is data or if there are
    // no element dependencies i.e. the lookup can be run at any time.
    if (!element.elementDependencies.length || data) {
      return true
    }
    return undefined
  }, [data, element.elementDependencies.length])

  return (
    <LookupNotification
      autoLookupValue={isAutoLookup ? stringifyData : undefined}
      element={element}
      onLookup={handleLookup}
      stringifyAutoLookupValue={stringifyLookupButtonValue}
    >
      <div className="cypress-lookup-button-element">
        <FormElementLabelContainer
          className="ob-lookup-button"
          id={id}
          element={element}
          required={false}
        >
          <LookupButton
            value={value}
            validationMessage={undefined}
            lookupButtonConfig={element.lookupButton}
          />
          <FormElementLookupButtonValidationMessage
            {...validationMessageProps}
          />
        </FormElementLabelContainer>
      </div>
    </LookupNotification>
  )
}

export default memo(FormElementLookupButton)

function generateLookupButtonValue(
  elementDependencies: FormTypes.LookupButtonFormElement['elementDependencies'],
  elements: FormTypes.FormElement[],
  formSubmissionModel:
    | SubmissionTypes.S3SubmissionData['submission']
    | undefined,
): {
  isAutoLookup: boolean
  data: SubmissionTypes.S3SubmissionData['submission'] | undefined
} {
  if (!formSubmissionModel) {
    return {
      isAutoLookup: false,
      data: undefined,
    }
  }

  // "data" should be `undefined` if there are no dependent elements with a value.
  // If a least one dependent element has a value, we will enable to lookup to run.
  return elementDependencies.reduce<{
    isAutoLookup: boolean
    data: SubmissionTypes.S3SubmissionData['submission'] | undefined
  }>(
    (memo, elementDependency) => {
      const formElement = formElementsService.findFormElement(
        elements,
        (formElement) => formElement.id === elementDependency.elementId,
      )
      if (!formElement || !('name' in formElement)) {
        return memo
      }

      const formElementValue = formSubmissionModel[formElement.name]

      switch (elementDependency.type) {
        case 'FORM_FORM_ELEMENT': {
          if (
            formElement.type === 'form' &&
            Array.isArray(formElement.elements)
          ) {
            const nestedLookupButtonValue = generateLookupButtonValue(
              [elementDependency.elementDependency],
              formElement.elements,
              formElementValue as SubmissionTypes.S3SubmissionData['submission'],
            )
            return {
              isAutoLookup:
                memo.isAutoLookup && nestedLookupButtonValue.isAutoLookup,
              data:
                nestedLookupButtonValue.data !== undefined
                  ? {
                      ...memo.data,
                      [formElement.name]: {
                        ...(memo?.data?.[formElement.name] || {}),
                        ...nestedLookupButtonValue.data,
                      },
                    }
                  : memo.data,
            }
          }
          break
        }
        case 'REPEATABLE_SET_FORM_ELEMENT': {
          if (formElement.type === 'repeatableSet') {
            const entries: {
              isAutoLookup: boolean
              data: Record<
                number,
                SubmissionTypes.S3SubmissionData['submission'] | undefined
              >
            } = {
              isAutoLookup: memo.isAutoLookup,
              data: {},
            }
            let hasAnEntry = false
            const existingEntries =
              (memo.data?.[formElement.name] as object[]) || undefined
            if (Array.isArray(formElementValue)) {
              for (const entry of formElementValue) {
                const index = formElementValue.indexOf(entry)
                const nestedLookupButtonValue = generateLookupButtonValue(
                  [elementDependency.elementDependency],
                  formElement.elements,
                  entry as SubmissionTypes.S3SubmissionData['submission'],
                )
                entries.isAutoLookup =
                  entries.isAutoLookup && nestedLookupButtonValue.isAutoLookup
                if (nestedLookupButtonValue.data || existingEntries?.[index]) {
                  entries.data[index] = {
                    ...existingEntries?.[index],
                    ...nestedLookupButtonValue.data,
                  }
                  hasAnEntry = true
                } else {
                  entries.data[index] = undefined
                }
              }
            }

            return {
              isAutoLookup: memo.isAutoLookup && entries.isAutoLookup,
              data: hasAnEntry
                ? {
                    ...memo.data,
                    [formElement.name]: entries.data,
                  }
                : memo.data,
            }
          }
          break
        }
        default: {
          if (formElement && 'name' in formElement) {
            const dependencyValue = formSubmissionModel[formElement.name]
            const isAutoLookupChecker = autoLookupElementMap[formElement.type]
            const isFormElementAutoLookup =
              typeof isAutoLookupChecker === 'function'
                ? isAutoLookupChecker(formElement)
                : isAutoLookupChecker
            return {
              isAutoLookup: memo.isAutoLookup && isFormElementAutoLookup,
              data:
                dependencyValue !== undefined && dependencyValue !== null
                  ? {
                      ...memo.data,
                      [formElement.name]: dependencyValue,
                    }
                  : memo.data,
            }
          }
          break
        }
      }

      return memo
    },
    {
      isAutoLookup: true,
      data: undefined,
    },
  )
}

// Creating an object here so we get a Typescript error when adding a
// new element type and forgetting to add to the array of allowed types
const autoLookupElementMap: Record<
  Exclude<FormTypes.FormElement['type'], 'page'>,
  boolean | ((element: FormTypes.FormElement) => boolean)
> = {
  text: false,
  textarea: false,
  number: false,
  email: false,
  telephone: false,
  barcodeScanner: false,
  radio: true,
  checkboxes: false,
  select: (formElement) => formElement.type === 'select' && !formElement.multi,
  autocomplete: true,
  boolean: true,
  date: false,
  datetime: false,
  time: false,
  heading: false,
  html: false,
  image: false,
  infoPage: false,
  camera: false,
  repeatableSet: false,
  draw: false,
  calculation: false,
  location: true,
  files: true,
  captcha: false,
  form: false,
  summary: false,
  compliance: true,
  geoscapeAddress: true,
  pointAddress: true,
  googleAddress: false,
  civicaStreetName: true,
  civicaNameRecord: false,
  section: false,
  bsb: false,
  abn: false,
  freshdeskDependentField: false,
  apiNSWLiquorLicence: true,
  arcGISWebMap: true,
  pointCadastralParcel: true,
  lookupButton: false,
}
