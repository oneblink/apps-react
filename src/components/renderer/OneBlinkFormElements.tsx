import * as React from 'react'
import clsx from 'clsx'

import LookupNotification from './LookupNotification'
import ReverseGeocode from './ReverseGeocode'

import FormElementBarcodeScanner from '../../form-elements/FormElementBarcodeScanner'
import FormElementEmail from '../../form-elements/FormElementEmail'
import FormElementABN from '../../form-elements/FormElementABN'
import FormElementBSB from '../../form-elements/FormElementBSB'
import FormElementText from '../../form-elements/FormElementText'
import FormElementTextarea from '../../form-elements/FormElementTextarea'
import FormElementNumber from '../../form-elements/FormElementNumber'
import FormElementHeading from '../../form-elements/FormElementHeading'
import FormElementHTML from '../../form-elements/FormElementHTML'
import FormElementTelephone from '../../form-elements/FormElementTelephone'
import FormElementSelect from '../../form-elements/FormElementSelect'
import FormElementDate from '../../form-elements/FormElementDate'
import FormElementImage from '../../form-elements/FormElementImage'
import FormElementDateTime from '../../form-elements/FormElementDateTime'
import FormElementTime from '../../form-elements/FormElementTime'
import FormElementCalculation from '../../form-elements/FormElementCalculation'
import FormElementRadio from '../../form-elements/FormElementRadio'
import FormElementAutocomplete from '../../form-elements/FormElementAutocomplete'
import FormElementRepeatableSet from '../../form-elements/FormElementRepeatableSet'
import FormElementSignature from '../../form-elements/FormElementSignature'
import FormElementCheckBoxes from '../../form-elements/FormElementCheckBoxes'
import FormElementFiles, {
  stringifyAttachments,
} from '../../form-elements/FormElementFiles'
import FormElementForm from '../../form-elements/FormElementForm'
import FormElementSection from '../../form-elements/FormElementSection'
import FormElementCamera from '../../form-elements/FormElementCamera'
import FormElementSummary from '../../form-elements/FormElementSummary'
import FormElementCaptcha from '../../form-elements/FormElementCaptcha'
import FormElementLocation, {
  stringifyLocation,
} from '../../form-elements/FormElementLocation'
import FormElementGeoscapeAddress from '../../form-elements/FormElementGeoscapeAddress'
import FormElementCompliance, {
  stringifyComplianceValue,
} from '../../form-elements/FormElementCompliance'
import FormElementPointAddress from '../../form-elements/FormElementPointAddress'
import FormElementGoogleAddress from '../../form-elements/FormElementGoogleAddress'
import FormElementBoolean from '../../form-elements/FormElementBoolean'
import FormElementCivicaStreetName from '../../form-elements/FormElementCivicaStreetName'
import FormElementCivicaNameRecord from '../../form-elements/FormElementCivicaNameRecord'
import FormElementFreshdeskDependentField from '../../form-elements/FormElementFreshdeskDependentField'
import FormElementArcGISWebMap, {
  stringifyArcgisInput,
} from '../../form-elements/FormElementArcGISWebMap'

import {
  APINSWTypes,
  CivicaTypes,
  FormTypes,
  GeoscapeTypes,
  GoogleTypes,
  MiscTypes,
  PointTypes,
  SubmissionTypes,
} from '@oneblink/types'

import { FormSubmissionModelContextProvider } from '../../hooks/useFormSubmissionModelContext'
import useBooleanState from '../../hooks/useBooleanState'
import useFormAudience from '../../hooks/useFormAudience'
import useFormIsReadOnly from '../../hooks/useFormIsReadOnly'
import isElementHiddenForAudience from '../../services/isElementHiddenForAudience'
import { isApproverEditable } from '../../services/isElementReadOnlyForAudience'
import resolveFormElementReadOnly from '../../services/resolveFormElementReadOnly'
import { FormElementBinaryStorageValue } from '../../types/attachments'
import {
  FormElementConditionallyShown,
  FormElementLookupHandler,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValidation,
  NestedFormElementValueChangeHandler,
  IsDirtyProps,
  UpdateFormElementsHandler,
  SectionState,
} from '../../types/form'
import { attachmentsService } from '../../apps'
import FormElementAPINSWLiquorLicence from '../../form-elements/FormElementAPINSWLiquorLicence'
import ElementDOMId from '../../utils/elementDOMIds'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import FormElementPointCadastralParcel from '../../form-elements/FormElementPointCadastralParcel'
import FormElementLookupButton from '../../form-elements/FormElementLookupButton'
import FormElementPointAddressV3 from '../../form-elements/FormElementPointAddressV3'

export type Props<T extends FormTypes._NestedElementsElement> = {
  formId: number
  elements: FormTypes.FormElement[]
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  formElementsValidation: FormElementsValidation | undefined
  displayValidationMessages: boolean
  onChange: NestedFormElementValueChangeHandler
  onLookup: FormElementLookupHandler
  onUpdateFormElements: UpdateFormElementsHandler
  // Props passed by repeatable sets
  isEven?: boolean
  idPrefix: string
  model: SubmissionTypes.S3SubmissionData['submission']
  parentElement: T
  sectionState?: SectionState
  /**
   * Inherited lock for nested fields (`parentReadOnly`). True when the whole
   * form is read-only, an ancestor is read-only, or a parent element’s
   * definition has `readOnly: true`. Does not include an ancestor’s audience
   * lock. A child with `approverEditability.type` `ALL_STEPS` also ignores this
   * inherited `readOnly` lock while an approver is reviewing.
   */
  readOnly?: boolean
  /**
   * When set, forces each child’s `readOnly` instead of the usual
   * inherit-or-audience calculation. Used for synthetic nested fields (Civica
   * name records, Freshdesk dependent fields) that should follow their parent’s
   * audience lock.
   */
  readOnlyOverride?: boolean
}

interface FormElementSwitchProps extends IsDirtyProps {
  formId: number
  element: FormTypes.FormElement
  /**
   * Whether this element’s own controls are locked. Includes form-level
   * read-only, inherited parent lock, this element’s definition `readOnly:
   * true`, and audience lock. Approvers can still edit when
   * `approverEditability.type` is `ALL_STEPS`, including when `readOnly` is set
   * or a parent is read-only.
   */
  readOnly: boolean
  /**
   * Whether nested fields should inherit a lock. True for form-level read-only,
   * an inherited parent lock, or this element’s definition `readOnly: true`.
   * Does not include this element’s audience lock. A descendant with
   * `approverEditability.type` `ALL_STEPS` can still be independently editable
   * for an approver.
   */
  descendantsReadOnly: boolean
  value: unknown | undefined
  formElementValidation: FormElementValidation | undefined
  displayValidationMessage: boolean
  formElementConditionallyShown: FormElementConditionallyShown | undefined
  id: string
  isEven: boolean | undefined
  onChange: NestedFormElementValueChangeHandler
  onLookup: FormElementLookupHandler
  onUpdateFormElements: UpdateFormElementsHandler
  sectionState: SectionState
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
  onUpdateFormElements,
  model,
  parentElement,
  sectionState,
  readOnly,
  readOnlyOverride,
}: Props<T>) {
  const audience = useFormAudience()
  const formIsReadOnly = useFormIsReadOnly()
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

          const ariaDescribedBy =
            element.hintPosition === 'BELOW_LABEL' && !!element.hint
              ? `${idPrefix}${element.id}-hint`
              : undefined

          const sectionHeaderId = `ob-section-header-${element.id}`

          return (
            <div
              key={element.id}
              className={clsx(
                'ob-element cypress-element-container',
                element.customCssClasses,
                {
                  'is-hidden': isElementHiddenForAudience(element, audience),
                },
              )}
              aria-labelledby={sectionHeaderId}
              aria-describedby={ariaDescribedBy}
              role="region"
            >
              <FormElementSection
                childrenReadOnly={formIsReadOnly || !!readOnly}
                formId={formId}
                element={element}
                displayValidationMessages={displayValidationMessages}
                idPrefix={idPrefix}
                formElementsConditionallyShown={formElementsConditionallyShown}
                formElementsValidation={formElementsValidation}
                onChange={onChange}
                onLookup={onLookup}
                onUpdateFormElements={onUpdateFormElements}
                model={model}
                parentElement={parentElement}
                sectionHeaderId={sectionHeaderId}
                sectionState={sectionState}
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
          <FormElementSwitchContainer
            key={element.id}
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
            onUpdateFormElements={onUpdateFormElements}
            sectionState={sectionState}
            parentReadOnly={readOnly}
            readOnlyOverride={readOnlyOverride}
          />
        )
      })}
    </FormSubmissionModelContextProvider>
  )
}

export default React.memo(OneBlinkFormElements)

function FormElementSwitchContainer(
  props: Omit<
    FormElementSwitchProps,
    'isDirty' | 'setIsDirty' | 'readOnly' | 'descendantsReadOnly'
  > & {
    /**
     * Lock inherited from a parent container (the parent’s
     * `descendantsReadOnly` / `childrenReadOnly`). Combined with form-level
     * read-only and this element’s definition `readOnly` to decide whether
     * descendants are locked. Does not include the parent’s audience lock. An
     * approver-editable child ignores this inherited lock.
     */
    parentReadOnly?: boolean
    /**
     * When set, this value is used as this element’s `readOnly` instead of
     * inherit-or-audience. See `readOnlyOverride` on `OneBlinkFormElements`.
     */
    readOnlyOverride?: boolean
  },
) {
  const { element, formElementValidation, displayValidationMessage } = props
  const audience = useFormAudience()
  const formIsReadOnly = useFormIsReadOnly()
  const descendantsReadOnly = React.useMemo(() => {
    if (formIsReadOnly) {
      return true
    }

    if (props.parentReadOnly) {
      return true
    }

    return 'readOnly' in element && element.readOnly === true
  }, [element, formIsReadOnly, props.parentReadOnly])

  const readOnly = React.useMemo(() => {
    if (formIsReadOnly) {
      return true
    }

    if (props.readOnlyOverride !== undefined) {
      return props.readOnlyOverride
    }

    if (audience === 'APPROVER' && isApproverEditable(element)) {
      return false
    }

    if (descendantsReadOnly) {
      return true
    }

    return resolveFormElementReadOnly(element, audience)
  }, [
    audience,
    descendantsReadOnly,
    element,
    formIsReadOnly,
    props.readOnlyOverride,
  ])

  const [isDirty, setIsDirty] = useBooleanState(false)
  const elementDOMId = React.useMemo(
    () => new ElementDOMId(props.id),
    [props.id],
  )
  const getValidationClass = () => {
    if (!('elements' in element)) {
      if (!formElementValidation) {
        return 'ob-element__valid'
      }
      if (isDirty || displayValidationMessage) {
        return 'ob-element__invalid'
      }
    }
  }
  const validationClassName = getValidationClass()

  if (element.type === 'page' || element.type === 'section') {
    return null
  }

  // An approver edit is not a new submission, so captchas are not applicable.
  if (
    element.type === 'captcha' &&
    (audience === 'APPROVER' || formIsReadOnly)
  ) {
    return null
  }

  return (
    <div
      id={elementDOMId.elementContainerDOMId}
      data-element-id={element.id}
      className={clsx(
        'ob-element cypress-element-container',
        element.customCssClasses,
        validationClassName,
        {
          'is-hidden': isElementHiddenForAudience(element, audience),
        },
      )}
      data-cypress-element-name={element.name}
      data-ob-name={element.name}
    >
      <FormElementSwitch
        {...props}
        readOnly={readOnly}
        descendantsReadOnly={descendantsReadOnly}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
      />
    </div>
  )
}

const FormElementSwitch = React.memo(function OneBlinkFormElement({
  formId,
  element,
  readOnly,
  descendantsReadOnly,
  value,
  displayValidationMessage,
  formElementValidation,
  formElementConditionallyShown,
  isEven,
  id,
  onChange,
  onLookup,
  onUpdateFormElements,
  isDirty,
  setIsDirty,
  sectionState,
}: FormElementSwitchProps & IsDirtyProps) {
  const dirtyProps = React.useMemo(
    () => ({ isDirty, setIsDirty }),
    [isDirty, setIsDirty],
  )
  const conditionallyShownOptionsElement =
    formElementConditionallyShown?.type === 'formElement'
      ? formElementConditionallyShown
      : undefined
  const validationMessage =
    typeof formElementValidation === 'string'
      ? formElementValidation
      : undefined
  const autocompleteAttributes =
    'autocompleteAttributes' in element
      ? element.autocompleteAttributes?.join(' ')
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
          onLookup={onLookup}
        >
          <FormElementDate
            readOnly={readOnly}
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
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'email': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementEmail
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'text': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementText
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'abn': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementABN
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'bsb': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementBSB
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'barcodeScanner': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementBarcodeScanner
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'textarea': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementTextarea
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'number': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementNumber
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'telephone': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementTelephone
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
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
            readOnly={readOnly}
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
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
            onUpdateFormElements={onUpdateFormElements}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
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
            readOnly={readOnly}
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
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
            onUpdateFormElements={onUpdateFormElements}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
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
            readOnly={readOnly}
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
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
            onUpdateFormElements={onUpdateFormElements}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'draw': {
      return (
        <FormElementSignature
          readOnly={readOnly}
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
          {...dirtyProps}
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
          readOnly={readOnly}
          childrenReadOnly={descendantsReadOnly}
          formId={formId}
          id={id}
          isEven={!isEven}
          element={element}
          value={
            value as
              | Array<SubmissionTypes.S3SubmissionData['submission']>
              | undefined
          }
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementRepeatableSet
            >['onChange']
          }
          onLookup={onLookup}
          formElementConditionallyShown={formElementConditionallyShown}
          formElementValidation={formElementValidation}
          displayValidationMessage={displayValidationMessage}
          onUpdateFormElements={onUpdateFormElements}
          sectionState={sectionState}
          {...dirtyProps}
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
          onLookup={onLookup}
        >
          <FormElementDateTime
            readOnly={readOnly}
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
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'time': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementTime
            readOnly={readOnly}
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
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'checkboxes': {
      return (
        <LookupNotification
          element={element}
          onLookup={onLookup}
        >
          <FormElementCheckBoxes
            readOnly={readOnly}
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
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
            onUpdateFormElements={onUpdateFormElements}
            {...dirtyProps}
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
            readOnly={readOnly}
            id={id}
            element={element}
            value={value as attachmentsService.Attachment[] | undefined}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementFiles
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'infoPage':
    case 'form': {
      return (
        <FormElementForm
          readOnly={readOnly}
          childrenReadOnly={descendantsReadOnly}
          formId={formId}
          id={id}
          element={element}
          value={
            value as SubmissionTypes.S3SubmissionData['submission'] | undefined
          }
          onChange={
            onChange as React.ComponentProps<typeof FormElementForm>['onChange']
          }
          onLookup={onLookup}
          displayValidationMessages={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={formElementConditionallyShown}
          onUpdateFormElements={onUpdateFormElements}
          sectionState={sectionState}
        />
      )
    }
    case 'camera': {
      return (
        <FormElementCamera
          readOnly={readOnly}
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
          {...dirtyProps}
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
          value={value as string | undefined}
          element={element}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCaptcha
            >['onChange']
          }
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          {...dirtyProps}
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
          <ReverseGeocode
            value={value}
            element={element}
            onChange={
              onChange as React.ComponentProps<
                typeof ReverseGeocode
              >['onChange']
            }
          >
            <FormElementLocation
              readOnly={readOnly}
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
              {...dirtyProps}
            />
          </ReverseGeocode>
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
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'compliance': {
      return (
        <LookupNotification
          autoLookupValue={value}
          stringifyAutoLookupValue={stringifyComplianceValue}
          element={element}
          onLookup={onLookup}
        >
          <FormElementCompliance
            readOnly={readOnly}
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
            conditionallyShownOptionsElement={conditionallyShownOptionsElement}
            isEven={isEven}
            onUpdateFormElements={onUpdateFormElements}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'freshdeskDependentField': {
      return (
        <FormElementFreshdeskDependentField
          readOnly={readOnly}
          childrenReadOnly={descendantsReadOnly}
          formId={formId}
          id={id}
          element={element}
          value={
            value as SubmissionTypes.S3SubmissionData['submission'] | undefined
          }
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementFreshdeskDependentField
            >['onChange']
          }
          onLookup={onLookup}
          displayValidationMessages={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={formElementConditionallyShown}
          onUpdateFormElements={onUpdateFormElements}
          sectionState={sectionState}
        />
      )
    }
    case 'pointCadastralParcel': {
      const v = value as PointTypes.PointCadastralParcelResponse | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementPointCadastralParcel
            readOnly={readOnly}
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementPointCadastralParcel
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
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
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'pointAddressV3': {
      const v = value as
        | PointTypes.PointAddressV3GetAddressDetailsResponse
        | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementPointAddressV3
            readOnly={readOnly}
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementPointAddressV3
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'googleAddress': {
      const v = value as GoogleTypes.GoogleMapsAddress | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementGoogleAddress
            readOnly={readOnly}
            id={id}
            formId={formId}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementGoogleAddress
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
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
            readOnly={readOnly}
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
            {...dirtyProps}
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
            readOnly={readOnly}
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
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'civicaNameRecord': {
      return (
        <FormElementCivicaNameRecord
          readOnly={readOnly}
          childrenReadOnly={descendantsReadOnly}
          formId={formId}
          id={id}
          element={element}
          value={
            value as SubmissionTypes.S3SubmissionData['submission'] | undefined
          }
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementCivicaNameRecord
            >['onChange']
          }
          onLookup={onLookup}
          displayValidationMessages={displayValidationMessage}
          formElementValidation={formElementValidation}
          formElementConditionallyShown={formElementConditionallyShown}
          onUpdateFormElements={onUpdateFormElements}
          sectionState={sectionState}
        />
      )
    }
    case 'apiNSWLiquorLicence': {
      const v = value as APINSWTypes.LiquorLicenceDetails | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
        >
          <FormElementAPINSWLiquorLicence
            readOnly={readOnly}
            formId={formId}
            id={id}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementAPINSWLiquorLicence
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            autocompleteAttributes={autocompleteAttributes}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'arcGISWebMap': {
      const v = value as ArcGISWebMapElementValue | undefined
      return (
        <LookupNotification
          autoLookupValue={value}
          element={element}
          onLookup={onLookup}
          stringifyAutoLookupValue={
            stringifyArcgisInput as React.ComponentProps<
              typeof LookupNotification
            >['stringifyAutoLookupValue']
          }
        >
          <FormElementArcGISWebMap
            readOnly={readOnly}
            id={id}
            element={element}
            value={v}
            onChange={
              onChange as React.ComponentProps<
                typeof FormElementArcGISWebMap
              >['onChange']
            }
            validationMessage={validationMessage}
            displayValidationMessage={displayValidationMessage}
            {...dirtyProps}
          />
        </LookupNotification>
      )
    }
    case 'lookupButton': {
      return (
        <FormElementLookupButton
          readOnly={readOnly}
          id={id}
          element={element}
          validationMessage={validationMessage}
          displayValidationMessage={displayValidationMessage}
          onChange={
            onChange as React.ComponentProps<
              typeof FormElementLookupButton
            >['onChange']
          }
          onLookup={onLookup}
          {...dirtyProps}
        />
      )
    }
    case 'section':
    case 'page': {
      return null
    }
    default: {
      const never: never = element
      console.warn('Invalid element', never)
      return null
    }
  }
})
