import * as React from 'react'
import clsx from 'clsx'
import InputMask from 'react-input-mask'
import { parseString } from 'xml2js'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useAbnLookupAuthenticationGuid from '../hooks/useAbnLookupAuthenticationGuid'
import { abnService } from '@oneblink/sdk-core'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
type Props = {
  id: string
  element: FormTypes.ABNElement
  value: MiscTypes.ABNRecord | undefined
  onChange: FormElementValueChangeHandler<MiscTypes.ABNRecord>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementABN({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const abnLookupAuthenticationGuid = useAbnLookupAuthenticationGuid()
  const [label, setLabel] = React.useState(
    value ? abnService.getABNNumberFromABNRecord(value) || '' : '',
  )
  const [isFocused, setIsFocused, removeFocus] = useBooleanState(false)
  const [{ isLoading, error }, setState] = React.useState<{
    isLoading: boolean
    error: Error | null
  }>({
    isLoading: false,
    error: null,
  })

  React.useEffect(() => {
    const searchString = label.replace(/[^\d]/g, '')
    const isSearchStringValid =
      searchString.length === 11 || (searchString.length === 9 && !isFocused)

    const currentABNNumber = value
      ? abnService.getABNNumberFromABNRecord(value)
      : ''
    if (!isSearchStringValid || currentABNNumber === searchString) {
      return
    }

    setState({
      isLoading: true,
      error: null,
    })

    const abortController = new AbortController()
    const fetchRecord = async () => {
      try {
        const urlSearchParams = new URLSearchParams()
        urlSearchParams.append('searchString', searchString)
        urlSearchParams.append('includeHistoricalDetails', 'N')
        if (abnLookupAuthenticationGuid) {
          urlSearchParams.append(
            'authenticationGuid',
            abnLookupAuthenticationGuid,
          )
        }

        const url =
          searchString.length === 11
            ? 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001'
            : 'https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByASICv201408'
        const response = await fetch(`${url}?${urlSearchParams.toString()}`, {
          mode: 'cors',
          signal: abortController.signal,
        })
        const text = await response.text()
        if (!response.ok) {
          throw new Error(text)
        }

        const result = await new Promise<{
          ABRPayloadSearchResults: {
            response: {
              businessEntity201408?: MiscTypes.ABNRecord
              businessEntity202001: MiscTypes.ABNRecord
              exception?: {
                exceptionDescription: string
                exceptionCode: string
              }
            }
          }
        }>((resolve, reject) => {
          parseString(
            text,
            {
              explicitArray: false,
            },
            (err, result) => {
              if (err) {
                reject(err)
              } else {
                resolve(result)
              }
            },
          )
        })
        if (result.ABRPayloadSearchResults.response.exception) {
          throw new Error(
            result.ABRPayloadSearchResults.response.exception.exceptionDescription,
          )
        }

        if (result.ABRPayloadSearchResults.response.businessEntity201408) {
          result.ABRPayloadSearchResults.response.businessEntity202001 =
            result.ABRPayloadSearchResults.response.businessEntity201408
        }

        if (
          !Array.isArray(
            result.ABRPayloadSearchResults.response.businessEntity202001
              .businessName,
          )
        ) {
          result.ABRPayloadSearchResults.response.businessEntity202001.businessName =
            [
              result.ABRPayloadSearchResults.response.businessEntity202001
                .businessName,
            ]
        }

        if (!abortController.signal.aborted) {
          onChange(element, {
            value: result.ABRPayloadSearchResults.response.businessEntity202001,
          })
          setState({
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setState({
            isLoading: false,
            error: err as Error,
          })
        }
      }
    }

    fetchRecord()

    return () => {
      abortController.abort()
    }
  }, [abnLookupAuthenticationGuid, element, isFocused, label, onChange, value])

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (value) {
      const newLabel = abnService.getABNNumberFromABNRecord(value)
      if (!newLabel) {
        // Record in value had no ABN Number. This should never happen
        return
      }
      if (label !== newLabel) {
        setLabel(
          newLabel.split('').reduce((memo, character, index) => {
            switch (index) {
              case 2:
              case 5:
              case 8: {
                return `${memo} ${character}`
              }
              default: {
                return `${memo}${character}`
              }
            }
          }, ''),
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      error) &&
    !isLookingUp

  return (
    <div className="cypress-abn-element">
      <FormElementLabelContainer
        className="ob-abn"
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
              mask={isFocused || value ? '99 999 999 999' : '999 999 999'}
              maskChar=" "
              type="text"
              id={id}
              name={element.name}
              className="input ob-input cypress-abn-control"
              placeholder={element.placeholderValue}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                if (value) {
                  onChange(element, {
                    value: undefined,
                  })
                }
              }}
              required={element.required}
              disabled={element.readOnly}
              onBlur={() => {
                setIsDirty()
                removeFocus()
              }}
              onFocus={setIsFocused}
            />
          </div>
          {value && (
            <div className="control ob-abn__record-control">
              <a className="button is-static ob-abn__record-button">
                {abnService.displayBusinessNameFromABNRecord(value)}
              </a>
            </div>
          )}
          {!!element.readOnly && !!value && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
                text={label}
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
        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {error?.message || validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementABN)
