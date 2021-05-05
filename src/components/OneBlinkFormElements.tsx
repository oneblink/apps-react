import * as React from 'react'

import useConditionallyShowOptionCallback from '../hooks/useConditionallyShowOptionCallback'
import LookupNotification from '../components/LookupNotification'

import FormElementBarcodeScanner from '../form-elements/FormElementBarcodeScanner'
import FormElementEmail from '../form-elements/FormElementEmail'
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
import FormElementFiles from '../form-elements/FormElementFiles'
import FormElementForm from '../form-elements/FormElementForm'
import FormElementCamera from '../form-elements/FormElementCamera'
import FormElementSummary from '../form-elements/FormElementSummary'
import FormElementCaptcha from '../form-elements/FormElementCaptcha'
import FormElementLocation from '../form-elements/FormElementLocation'
import FormElementGeoscapeAddress from '../form-elements/FormElementGeoscapeAddress'
import FormElementCompliance from '../form-elements/FormElementCompliance'
import FormElementPointAddress from '../form-elements/FormElementPointAddress'
import { FormTypes, GeoscapeTypes, PointTypes } from '@oneblink/types'

import { FormSubmissionModelContextProvider } from '../hooks/useFormSubmissionModelContext'
import { FormElementBinaryStorageValue } from '../types/attachments'

type Props = {
  formId: number
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  onChange: FormElementValueChangeHandler
  onChangeElements: (formElements: FormTypes.FormElement[]) => void
  onChangeModel: (model: FormElementsCtrl['model']) => void
  // Props passed by repeatable sets
  isEven?: boolean
  idPrefix: string
  formElementsCtrl: FormElementsCtrl
}

function OneBlinkFormElements({
  formId,
  elements,
  isEven,
  idPrefix,
  displayValidationMessages,
  formElementsValidation,
  formElementsConditionallyShown,
  onChange,
  onChangeElements,
  onChangeModel,
  formElementsCtrl,
}: Props) {
  return (
    <FormSubmissionModelContextProvider
      formElementsCtrl={formElementsCtrl}
      formElementsConditionallyShown={formElementsConditionallyShown}
    >
      {elements.map((element) => {
        if (element.type === 'page') {
          return null
        }

        if (
          formElementsConditionallyShown &&
          formElementsConditionallyShown[element.name] &&
          !formElementsConditionallyShown[element.name]?.isShown
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
              elements={elements}
              value={formElementsCtrl.model[element.name]}
              displayValidationMessage={displayValidationMessages}
              isEven={isEven}
              id={`${idPrefix}${element.name}`}
              formElementsConditionallyShown={formElementsConditionallyShown}
              formElementValidation={
                formElementsValidation
                  ? formElementsValidation[element.name]
                  : undefined
              }
              onChange={onChange}
              onChangeElements={onChangeElements}
              onChangeModel={onChangeModel}
              formElementsCtrl={formElementsCtrl}
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
  elements,
  value,
  displayValidationMessage,
  formElementValidation,
  formElementsConditionallyShown,
  isEven,
  id,
  onChange,
  onChangeElements,
  onChangeModel,
  formElementsCtrl,
}: {
  formId: number
  element: FormTypes.FormElement
  elements: FormTypes.FormElement[]
  value: unknown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  id: string
  isEven: Props['isEven']
  onChange: Props['onChange']
  onChangeElements: Props['onChangeElements']
  onChangeModel: Props['onChangeModel']
  formElementsCtrl: FormElementsCtrl
}) {
  const handleConditionallyShowOption = useConditionallyShowOptionCallback(
    formElementsCtrl,
    element,
  )
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
    case 'barcodeScanner': {
      return (
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
          isAutoLookup
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
            onConditionallyShowOption={handleConditionallyShowOption}
          />
        </LookupNotification>
      )
    }
    case 'select': {
      return (
        <LookupNotification
          isAutoLookup={!element.multi}
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
            onConditionallyShowOption={handleConditionallyShowOption}
          />
        </LookupNotification>
      )
    }
    case 'radio': {
      return (
        <LookupNotification
          isAutoLookup
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
            onConditionallyShowOption={handleConditionallyShowOption}
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
          value={value as Array<FormElementsCtrl['model']> | undefined}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementRepeatableSet
            >['onChange']
          }
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
          formElementConditionallyShown={
            formElementsConditionallyShown &&
            formElementsConditionallyShown[element.name]
          }
          formElementValidation={formElementValidation}
          displayValidationMessage={displayValidationMessage}
          parentFormElementsCtrl={formElementsCtrl}
        />
      )
    }
    case 'image': {
      return <FormElementImage element={element} />
    }
    case 'datetime': {
      return (
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
        <LookupNotification
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
        >
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
            onConditionallyShowOption={handleConditionallyShowOption}
          />
        </LookupNotification>
      )
    }
    case 'files': {
      return (
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
      )
    }
    case 'infoPage':
    case 'form': {
      return (
        <FormElementForm
          formId={formId}
          id={id}
          element={element}
          value={value as FormElementsCtrl['model'] | undefined}
          onChange={
            onChange as React.ComponentProps<typeof FormElementForm>['onChange']
          }
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
          displayValidationMessage={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={
            formElementsConditionallyShown &&
            formElementsConditionallyShown[element.name]
          }
          parentFormElementsCtrl={formElementsCtrl}
        />
      )
    }
    case 'camera': {
      return (
        <FormElementCamera
          id={id}
          element={element}
          value={value}
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
          isAutoLookup
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
          isAutoLookup
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
          isAutoLookup
          element={element}
          elements={elements}
          value={value ? (value as { value: unknown }).value : undefined}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
            onConditionallyShowOption={handleConditionallyShowOption}
            isEven={isEven}
          />
        </LookupNotification>
      )
    }
    case 'pointAddress': {
      const v = value as PointTypes.PointAddress | undefined
      return (
        <LookupNotification
          isAutoLookup
          element={element}
          elements={elements}
          value={value}
          formElementsCtrl={formElementsCtrl}
          formElementsConditionallyShown={formElementsConditionallyShown}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
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
    default: {
      console.warn('Invalid element', element)
      return null
    }
  }
})
