import * as React from 'react'
import { InputMask } from '@react-input/mask'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes, MiscTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { formService, OneBlinkAppsError } from '../apps'
import useIsOffline from '../hooks/useIsOffline'
import {
  isOffline as isNavigatorOffline,
  OFFLINE_ERROR_MESSAGE,
} from '../apps/offline-service'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'
import useBooleanState from '../hooks/useBooleanState'

type Props = {
  id: string
  formId: number
  element: FormTypes.BSBElement
  readOnly: boolean
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
  readOnly,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isOffline = useIsOffline()
  const [text, setText] = React.useState(typeof value === 'string' ? value : '')
  // A BSB already stored on the submission, or returned by a successful lookup.
  // Kept in a ref so a connectivity change can see it without starting another lookup.
  const validatedBsbRef = React.useRef(
    typeof value === 'string' ? value : undefined,
  )
  // Mirrors `bsbRecord` for the lookup effect. The effect must not list the
  // record as a dependency: clearing it to start a lookup would abort that lookup.
  const bsbRecordRef = React.useRef<MiscTypes.BSBRecord | null>(null)
  // Latest submission value, read by the lookup effect without re-running it
  // when that effect itself writes a new value.
  const valueRef = React.useRef(value)
  const [hasFocus, setHasFocus, removeFocus] = useBooleanState(false)
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
    bsbRecordRef.current = bsbRecord
    if (bsbRecord?.bsb) {
      validatedBsbRef.current = bsbRecord.bsb
    }
  }, [bsbRecord])

  React.useEffect(() => {
    if (bsbRecord) {
      onChange(element, {
        value: bsbRecord.bsb,
      })
    }
  }, [bsbRecord, element, onChange, value])

  React.useEffect(() => {
    valueRef.current = value
  }, [value])

  React.useEffect(() => {
    // Editing away from a validated BSB forgets that lookup. Typing the same
    // number back is a new check, so offline it shows the offline message
    // instead of keeping the previous result.
    if (
      validatedBsbRef.current !== undefined &&
      validatedBsbRef.current !== text
    ) {
      validatedBsbRef.current = undefined
    }

    if (text === '' || !isValidFormat) {
      setState((current) =>
        !current.isLoading && !current.errorMessage && !current.bsbRecord
          ? current
          : {
              isLoading: false,
              errorMessage: null,
              bsbRecord: null,
            },
      )
      if (valueRef.current !== undefined) {
        onChange(element, { value: undefined })
      }
      return
    }

    // This text was already accepted and has not been edited since.
    // Offline, leave a stored BSB alone. Online, leave it alone when its
    // bank record is still showing — a reconnect would otherwise clear that
    // record and, if the retry failed, replace the known-good value with
    // { isInvalid: true }.
    if (
      validatedBsbRef.current === text &&
      (isOffline || bsbRecordRef.current)
    ) {
      return
    }

    if (isOffline) {
      onChange(element, {
        value: { isInvalid: true, isValidating: false },
      })
      setState({
        isLoading: false,
        errorMessage: OFFLINE_ERROR_MESSAGE,
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
          const isOfflineError =
            isNavigatorOffline() ||
            (error instanceof OneBlinkAppsError && error.isOffline)
          onChange(element, {
            value: { isInvalid: true, isValidating: false },
          })
          setState({
            isLoading: false,
            errorMessage: isOfflineError
              ? OFFLINE_ERROR_MESSAGE
              : `The BSB number "${text}" does not exist`,
            bsbRecord: null,
          })
        }
      }
    }

    getBSBRecord()

    return () => {
      abortController.abort()
    }
  }, [formId, isOffline, isValidFormat, text, onChange, element])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      errorMessage) &&
    !isLookingUp

  const hasCopyButton = !!value && !!readOnly
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
              mask="xxx-xxx"
              replacement={{ x: /\d/ }}
              showMask={hasFocus}
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
              disabled={readOnly}
              onFocus={setHasFocus}
              onBlur={() => {
                removeFocus()
                if (text === 'xxx-xxx') {
                  onChange(element, {
                    value: undefined,
                  })
                  setText('')
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
            overrideRequiredMessage={undefined}
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
