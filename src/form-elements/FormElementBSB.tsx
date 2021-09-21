import * as React from 'react'
import InputMask from 'react-input-mask'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormElementValueChangeHandler } from '../types/form'
import { formService } from '@oneblink/apps'

type Props = {
  id: string
  formId: number
  element: FormTypes.BSBElement
  value: unknown
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementBSB({
  id,
  formId,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [text, setText] = React.useState(typeof value === 'string' ? value : '')
  const isValid = /\d{3}-\d{3}/.test(text)

  const [isDirty, setIsDirty] = useBooleanState(false)
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
    if (text === '' && value !== undefined) {
      onChange(element)
    }
  }, [element, onChange, text, value])

  React.useEffect(() => {
    if (bsbRecord && value === undefined) {
      onChange(element, bsbRecord.bsb)
    }
  }, [bsbRecord, element, onChange, value])

  React.useEffect(() => {
    if (text === '') {
      return
    }

    if (!isValid) {
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
          setState({
            isLoading: false,
            errorMessage: `The BSB number "${text}" does not exist`,
            bsbRecord: null,
          })
          setText('')
        }
      }
    }

    getBSBRecord()

    return () => {
      abortController.abort()
    }
  }, [formId, isValid, text])

  return (
    <div className="cypress-bsb-element">
      <FormElementLabelContainer
        className="ob-bsb"
        id={id}
        element={element}
        required={element.required}
      >
        <div className="field has-addons">
          <div
            className={clsx('control is-expanded', {
              'is-loading': isLoading,
            })}
          >
            <InputMask
              mask="999-999"
              // @ts-expect-error "maskChar" is not in the types, but it is in the docs
              maskChar="x"
              type="text"
              placeholder={element.placeholderValue}
              id={id}
              name={element.name}
              className="input ob-input cypress-bsb-control"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required={element.required}
              disabled={element.readOnly}
              onBlur={setIsDirty}
            />
          </div>
          {bsbRecord && (
            <div className="control ob-bsb__record-control">
              <a className="button is-static ob-bsb__record-button">
                {bsbRecord.financialInstitutionMnemonic} - {bsbRecord.name}
              </a>
            </div>
          )}
          {!!element.readOnly && !!value && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon cypress-copy-to-clipboard-button"
                isInputButton
                text={text}
              />
            </div>
          )}
          <LookupButton
            isInputButton
            value={value}
            validationMessage={validationMessage}
          />
        </div>
        {(((isDirty || displayValidationMessage) &&
          !!validationMessage &&
          !isLoading) ||
          errorMessage) && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {errorMessage || validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementBSB)
