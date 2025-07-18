import * as React from 'react'
import InputMask from 'react-input-mask'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { formService } from '@oneblink/apps'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  formId: number
  element: FormTypes.BSBElement
  value: unknown
  onChange: FormElementValueChangeHandler<
    string | { isInvalid: boolean; isValidating: boolean }
  >
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps

function FormElementBSB({
  id,
  formId,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const [text, setText] = React.useState(typeof value === 'string' ? value : '')
  const isValidFormat = /\d{3}-\d{3}/.test(text)

  const [{ isLoading, errorMessage, bsbRecord }, setState] = React.useState<{
    isLoading: boolean
    errorMessage: string | null
    bsbRecord: MiscTypes.BSBRecord | null
  }>({
    isLoading: false,
    errorMessage: null,
    bsbRecord: null,
  })

  React.useEffect(() => {
    if (bsbRecord) {
      onChange(element, {
        value: bsbRecord.bsb,
      })
    }
  }, [bsbRecord, element, onChange, value])

  React.useEffect(() => {
    if (text === '') {
      return
    }

    if (!isValidFormat) {
      setState({
        isLoading: false,
        errorMessage: null,
        bsbRecord: null,
      })
      return
    }

    setState({
      isLoading: true,
      errorMessage: null,
      bsbRecord: null,
    })

    const abortController = new AbortController()
    const getBSBRecord = async () => {
      onChange(element, {
        value: { isValidating: true, isInvalid: false },
      })
      try {
        const bsbRecord = await formService.getBSBRecord(
          formId,
          text,
          abortController.signal,
        )
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            errorMessage: null,
            bsbRecord,
          })
        }
      } catch (error) {
        console.warn('Error validating BSB number', error)
        if (!abortController.signal.aborted) {
          onChange(element, {
            value: { isInvalid: true, isValidating: false },
          })
          setState({
            isLoading: false,
            errorMessage: `The BSB number "${text}" does not exist`,
            bsbRecord: null,
          })
        }
      }
    }

    getBSBRecord()

    return () => {
      abortController.abort()
    }
  }, [formId, isValidFormat, text, onChange, element])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      errorMessage) &&
    !isLookingUp

  const hasCopyButton = !!value && !!element.readOnly
  const hasLookupButton = element.isDataLookup || element.isElementLookup
  return (
    <div className="cypress-bsb-element">
      <FormElementLabelContainer
        className="ob-bsb"
        id={id}
        element={element}
        required={element.required}
      >
        <div
          className={clsx('field has-addons', {
            'no-addons-mobile': !hasCopyButton && !hasLookupButton,
          })}
        >
          <div
            className={clsx('control is-expanded', {
              'is-loading': isLoading,
            })}
          >
            <InputMask
              mask="999-999"
              maskChar="x"
              type="text"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-bsb-control"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
              }}
              required={element.required}
              disabled={element.readOnly}
              onBlur={() => {
                if (text === 'xxx-xxx') {
                  onChange(element, {
                    value: undefined,
                  })
                }
                setIsDirty()
              }}
              aria-describedby={ariaDescribedby}
              autoComplete={autocompleteAttributes}
              aria-required={element.required}
            />
          </div>
          {bsbRecord && (
            <BSBDisplay
              bsbRecord={bsbRecord}
              className="ob-bsb__display-desktop"
            />
          )}
          {hasCopyButton && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
            lookupButtonConfig={element.lookupButton}
          />
        </div>
        {bsbRecord && (
          <BSBDisplay
            bsbRecord={bsbRecord}
            className="ob-bsb__display-mobile"
          />
        )}
        {isDisplayingValidationMessage && (
          <FormElementValidationMessage
            message={errorMessage || validationMessage}
          />
        )}
      </FormElementLabelContainer>
    </div>
  )
}

const BSBDisplay = ({
  bsbRecord,
  className,
}: {
  bsbRecord: MiscTypes.BSBRecord
  className: string
}) => {
  return (
    <div className={`control ob-bsb__record-control ${className}`}>
      <a className="button is-static ob-bsb__record-button">
        {bsbRecord.financialInstitutionMnemonic} - {bsbRecord.name}
      </a>
    </div>
  )
}
export default React.memo(FormElementBSB)
