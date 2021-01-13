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
import { FormTypes, GeoscapeTypes } from '@oneblink/types'
import FormElementGeoscapeAddress from '../form-elements/FormElementGeoscapeAddress'

type Props = {
  formId: number
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  onChange: (
    formElement: FormTypes.FormElement,
    value: unknown | undefined,
  ) => void
  onChangeElements: (formElements: FormTypes.FormElement[]) => void
  onChangeModel: (model: FormElementsCtrl['model']) => void
  // Props passed by repeatable sets
  isEven?: boolean
  idPrefix?: string
  formElementsCtrl: FormElementsCtrl

  // Nested forms
  parentFormName?: string
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
  parentFormName,
}: Props) {
  return (
    <>
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
              id={idPrefix ? `${idPrefix}_${element.name}` : element.name}
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
              parentFormName={parentFormName}
            />
          </div>
        )
      })}
    </>
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
  parentFormName,
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
  parentFormName?: string
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
          value={value}
          onChange={onChange}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'calculation': {
      return (
        <FormElementCalculation
          element={element}
          formElementsCtrl={formElementsCtrl}
          parentFormName={parentFormName}
          onChange={onChange}
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
          onChange={onChange}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
          formElementConditionallyShown={
            formElementsConditionallyShown &&
            formElementsConditionallyShown[element.name]
          }
          formElementValidation={formElementValidation}
          displayValidationMessage={displayValidationMessage}
          parentFormElementsCtrl={formElementsCtrl}
          parentFormName={parentFormName}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
          onChange={onChange}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'infoPage':
    case 'form': {
      // @ts-expect-error cannot convert unknown to a  typescript Record<>
      const v: FormElementsCtrl['model'] | undefined = value
      return (
        <FormElementForm
          formId={formId}
          id={id}
          element={element}
          value={v}
          onChange={onChange}
          onChangeElements={onChangeElements}
          onChangeModel={onChangeModel}
          displayValidationMessage={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={
            formElementsConditionallyShown &&
            formElementsConditionallyShown[element.name]
          }
          parentFormName={
            parentFormName ? `${parentFormName}|${element.name}` : element.name
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
          onChange={onChange}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
        />
      )
    }
    case 'summary': {
      return (
        <FormElementSummary
          element={element}
          formElementsCtrl={formElementsCtrl}
          onChange={onChange}
          value={value}
        />
      )
    }
    case 'captcha': {
      return (
        <FormElementCaptcha
          element={element}
          onChange={onChange}
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
            onChange={onChange}
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
          />
        </LookupNotification>
      )
    }
    case 'geoscapeAddress': {
      // @ts-expect-error cannot convert unknown to a  typescript Record<>
      const v: GeoscapeTypes.GeoscapeAddress | undefined = value
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
            onChange={onChange}
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
