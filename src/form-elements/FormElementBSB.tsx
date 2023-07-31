import * as React from 'react'
import InputMask from 'react-input-mask'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { formService } from '@oneblink/apps'

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
}: Props) {
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
        executedLookups: { [element.name]: false },
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
            executedLookups: { [element.name]: false },
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
                    executedLookups: { [element.name]: false },
                  })
                }
                setIsDirty()
              }}
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
