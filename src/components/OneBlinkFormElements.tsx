import * as React from 'react'

import LookupNotification from '../components/LookupNotification'

import FormElementBarcodeScanner from '../form-elements/FormElementBarcodeScanner'
import FormElementEmail from '../form-elements/FormElementEmail'
import FormElementABN from '../form-elements/FormElementABN'
import FormElementBSB from '../form-elements/FormElementBSB'
import FormElementText from '../form-elements/FormElementText'
import FormElementTextarea from '../form-elements/FormElementTextarea'
import FormElementNumber from '../form-elements/FormElementNumber'
import FormElementHeading from '../form-elements/FormElementHeading'
import FormElementHTML from '../form-elements/FormElementHTML'
import FormElementTelephone from '../form-elements/FormElementTelephone'
import FormElementSelect from '../form-elements/FormElementSelect'
import FormElementDate from '../form-elements/FormElementDate'
import FormElementImage from '../form-elements/FormElementImage'
import FormElementDateTime from '../form-elements/FormElementDateTime'
import FormElementTime from '../form-elements/FormElementTime'
import FormElementCalculation from '../form-elements/FormElementCalculation'
import FormElementRadio from '../form-elements/FormElementRadio'
import FormElementAutocomplete from '../form-elements/FormElementAutocomplete'
import FormElementRepeatableSet from '../form-elements/FormElementRepeatableSet'
import FormElementSignature from '../form-elements/FormElementSignature'
import FormElementCheckBoxes from '../form-elements/FormElementCheckBoxes'
import FormElementFiles, {
  stringifyAttachments,
} from '../form-elements/FormElementFiles'
import FormElementForm from '../form-elements/FormElementForm'
import FormElementSection from '../form-elements/FormElementSection'
import FormElementCamera from '../form-elements/FormElementCamera'
import FormElementSummary from '../form-elements/FormElementSummary'
import FormElementCaptcha from '../form-elements/FormElementCaptcha'
import FormElementLocation, {
  stringifyLocation,
} from '../form-elements/FormElementLocation'
import FormElementGeoscapeAddress from '../form-elements/FormElementGeoscapeAddress'
import FormElementCompliance from '../form-elements/FormElementCompliance'
import FormElementPointAddress from '../form-elements/FormElementPointAddress'
import FormElementBoolean from '../form-elements/FormElementBoolean'
import FormElementCivicaStreetName from '../form-elements/FormElementCivicaStreetName'
import FormElementCivicaNameRecord from '../form-elements/FormElementCivicaNameRecord'

import {
  CivicaTypes,
  FormTypes,
  GeoscapeTypes,
  MiscTypes,
  PointTypes,
} from '@oneblink/types'

import { FormSubmissionModelContextProvider } from '../hooks/useFormSubmissionModelContext'
import { FormElementBinaryStorageValue } from '../types/attachments'
import {
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValidation,
  FormElementValueChangeHandler,
  FormSubmissionModel,
} from '../types/form'

export type Props<T extends FormTypes._NestedElementsElement> = {
  formId: number
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  onChange: FormElementValueChangeHandler
  onLookup: FormElementLookupHandler
  // Props passed by repeatable sets
  isEven?: boolean
  idPrefix: string
  model: FormSubmissionModel
  parentElement: T
}

function OneBlinkFormElements<T extends FormTypes._NestedElementsElement>({
  formId,
  elements,
  isEven,
  idPrefix,
  displayValidationMessages,
  formElementsValidation,
  formElementsConditionallyShown,
  onChange,
  onLookup,
  model,
  parentElement,
}: Props<T>) {
  return (
    <FormSubmissionModelContextProvider
      elements={parentElement.elements}
      model={model}
      formElementsConditionallyShown={formElementsConditionallyShown}
    >
      {elements.map((element) => {
        if (element.type === 'section') {
          if (formElementsConditionallyShown?.[element.id]?.isHidden) {
            return null
          }

          return (
            <div
              key={element.id}
              className="ob-element cypress-element-container"
            >
              <FormElementSection
                formId={formId}
                element={element}
                displayValidationMessages={displayValidationMessages}
                idPrefix={idPrefix}
                formElementsConditionallyShown={formElementsConditionallyShown}
                formElementsValidation={formElementsValidation}
                onChange={onChange}
                onLookup={onLookup}
                model={model}
                parentElement={parentElement}
              />
            </div>
          )
        }

        if (
          element.type === 'page' ||
          formElementsConditionallyShown?.[element.name]?.isHidden
        ) {
          return null
        }

        return (
          <div
            key={element.id}
            className="ob-element cypress-element-container"
            data-cypress-element-name={element.name}
            data-ob-name={element.name}
          >
            <FormElementSwitch
              formId={formId}
              element={element}
              value={model[element.name]}
              displayValidationMessage={displayValidationMessages}
              isEven={isEven}
              id={`${idPrefix}${element.name}`}
              formElementConditionallyShown={
                formElementsConditionallyShown?.[element.name]
              }
              formElementValidation={formElementsValidation?.[element.name]}
              onChange={onChange}
              onLookup={onLookup}
            />
          </div>
        )
      })}
    </FormSubmissionModelContextProvider>
  )
}

export default React.memo(OneBlinkFormElements)

const FormElementSwitch = React.memo(function OneBlinkFormElement({
  formId,
  element,
  value,
  displayValidationMessage,
  formElementValidation,
  formElementConditionallyShown,
  isEven,
  id,
  onChange,
  onLookup,
}: {
  formId: number
  element: FormTypes.FormElement
  value: unknown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  id: string
  isEven: boolean | undefined
  onChange: FormElementValueChangeHandler
  onLookup: FormElementLookupHandler
}) {
  const conditionallyShownOptions =
    formElementConditionallyShown?.type === 'formElement'
      ? formElementConditionallyShown?.options
      : undefined
  const validationMessage =
    typeof formElementValidation === 'string'
      ? formElementValidation
      : undefined
  switch (element.type) {
    case 'heading': {
      return <FormElementHeading element={element} />
    }
    case 'html': {
      return <FormElementHTML element={element} />
    }
    case 'date': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementDate
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementDate
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'email': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementEmail
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementEmail
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'text': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementText
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementText
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'abn': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementABN
            id={id}
            element={element}
            value={value as MiscTypes.ABNRecord | undefined}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementABN
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'bsb': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementBSB
            id={id}
            formId={formId}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementBSB
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'barcodeScanner': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementBarcodeScanner
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementBarcodeScanner
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'textarea': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementTextarea
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementTextarea
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'number': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementNumber
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementNumber
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'telephone': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementTelephone
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementTelephone
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'autocomplete': {
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementAutocomplete
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementAutocomplete
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            conditionallyShownOptions={conditionallyShownOptions}
          />
        </LookupNotification>
      )
    }
    case 'select': {
      return (
        <LookupNotification
          autoLookupValue={!element.multi ? value : undefined}
          element={element}
          onLookup={onLookup}
        >
          <FormElementSelect
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementSelect
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            conditionallyShownOptions={conditionallyShownOptions}
          />
        </LookupNotification>
      )
    }
    case 'radio': {
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementRadio
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementRadio
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            conditionallyShownOptions={conditionallyShownOptions}
          />
        </LookupNotification>
      )
    }
    case 'draw': {
      return (
        <FormElementSignature
          id={id}
          element={element}
          value={value as FormElementBinaryStorageValue}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementSignature
            >['onChange']
          }
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'calculation': {
      return (
        <FormElementCalculation
          element={element}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCalculation
            >['onChange']
          }
          value={value}
        />
      )
    }
    case 'repeatableSet': {
      return (
        <FormElementRepeatableSet
          formId={formId}
          id={id}
          isEven={!isEven}
          element={element}
          value={value as Array<FormSubmissionModel> | undefined}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementRepeatableSet
            >['onChange']
          }
          onLookup={onLookup}
          formElementConditionallyShown={formElementConditionallyShown}
          formElementValidation={formElementValidation}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'image': {
      return <FormElementImage element={element} />
    }
    case 'datetime': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementDateTime
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementDateTime
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'time': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementTime
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementTime
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'checkboxes': {
      return (
        <LookupNotification element={element} onLookup={onLookup}>
          <FormElementCheckBoxes
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementCheckBoxes
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            conditionallyShownOptions={conditionallyShownOptions}
          />
        </LookupNotification>
      )
    }
    case 'files': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
          autoLookupValue={value}
          stringifyAutoLookupValue={
            stringifyAttachments as React.ComponentProps<
              typeof LookupNotification
            >['stringifyAutoLookupValue']
          }
        >
          <FormElementFiles
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementFiles
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'infoPage':
    case 'form': {
      return (
        <FormElementForm
          formId={formId}
          id={id}
          element={element}
          value={value as FormSubmissionModel | undefined}
          onChange={
            onChange as React.ComponentProps<typeof FormElementForm>['onChange']
          }
          onLookup={onLookup}
          displayValidationMessages={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={formElementConditionallyShown}
        />
      )
    }
    case 'camera': {
      return (
        <FormElementCamera
          id={id}
          element={element}
          value={value as FormElementBinaryStorageValue}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCamera
            >['onChange']
          }
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'summary': {
      return (
        <FormElementSummary
          element={element}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementSummary
            >['onChange']
          }
          value={value}
        />
      )
    }
    case 'captcha': {
      return (
        <FormElementCaptcha
          element={element}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCaptcha
            >['onChange']
          }
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'location': {
      return (
        <LookupNotification
          autoLookupValue={value}
          stringifyAutoLookupValue={
            stringifyLocation as React.ComponentProps<
              typeof LookupNotification
            >['stringifyAutoLookupValue']
          }
          element={element}
          onLookup={onLookup}
        >
          <FormElementLocation
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementLocation
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'geoscapeAddress': {
      const v = value as GeoscapeTypes.GeoscapeAddress | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementGeoscapeAddress
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementGeoscapeAddress
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'compliance': {
      return (
        <LookupNotification
          autoLookupValue={
            value ? (value as { value: unknown }).value : undefined
          }
          element={element}
          onLookup={onLookup}
        >
          <FormElementCompliance
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementCompliance
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            conditionallyShownOptions={conditionallyShownOptions}
            isEven={isEven}
          />
        </LookupNotification>
      )
    }
    case 'pointAddress': {
      const v = value as PointTypes.PointAddress | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementPointAddress
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementPointAddress
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'boolean': {
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementBoolean
            id={id}
            element={element}
            value={value}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementBoolean
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'civicaStreetName': {
      const v = value as CivicaTypes.CivicaStreetName | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementCivicaStreetName
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementCivicaStreetName
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'civicaNameRecord': {
      return (
        <FormElementCivicaNameRecord
          formId={formId}
          id={id}
          element={element}
          value={value as FormSubmissionModel | undefined}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCivicaNameRecord
            >['onChange']
          }
          onLookup={onLookup}
          displayValidationMessages={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={formElementConditionallyShown}
        />
      )
    }
    default: {
      console.warn('Invalid element', element)
      return null
    }
  }
})
