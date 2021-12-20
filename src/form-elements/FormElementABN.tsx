import * as React from 'react'
import clsx from 'clsx'
import InputMask from 'react-input-mask'
import { parseString } from 'xml2js'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { FormElementValueChangeHandler } from '../types/form'
import useAbnLookupAuthenticationGuid from '../hooks/useAbnLookupAuthenticationGuid'
import { abnService } from '@oneblink/sdk-core'
type Props = {
  id: string
  element: FormTypes.ABNElement
  value: MiscTypes.ABNRecord | undefined
  onChange: FormElementValueChangeHandler<MiscTypes.ABNRecord>
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementABN({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const abnLookupAuthenticationGuid = useAbnLookupAuthenticationGuid()
  const [label, setLabel] = React.useState(value?.ABN.identifierValue || '')
  const [isFocused, setIsFocused, removeFocus] = useBooleanState(false)
  const [isDirty, setIsDirty] = useBooleanState(false)
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
    if (!isSearchStringValid || value?.ABN.identifierValue === searchString) {
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
          onChange(
            element,
            result.ABRPayloadSearchResults.response.businessEntity202001,
          )
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
  }, [
    abnLookupAuthenticationGuid,
    element,
    isFocused,
    label,
    onChange,
    value?.ABN.identifierValue,
  ])

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
              // @ts-expect-error "maskChar" is not in the types, but it is in the docs
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
                  onChange(element, undefined)
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
                className="button is-input-addon cypress-copy-to-clipboard-button"
                isInputButton
                text={label}
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
          error) && (
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