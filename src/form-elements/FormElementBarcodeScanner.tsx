import * as React from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useLookupNotification, {
  LookupNotificationContext,
} from '../hooks/useLookupNotification'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'

type Props = {
  id: string
  element: FormTypes.BarcodeScannerElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

function FormElementBarcodeScanner({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
}: Props) {
  const [isCameraOpen, startBarcodeScanner, stopBarcodeScanner] =
    useBooleanState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const { onLookup } = useLookupNotification(value)
  const handleScan = React.useCallback(
    (newValue: string | undefined) => {
      setIsDirty()
      onChange(element, {
        value: newValue,
      })
      stopBarcodeScanner()
      onLookup()
    },
    [element, onChange, onLookup, setIsDirty, stopBarcodeScanner],
  )

  const openBarcodeScanner = React.useCallback(() => {
    if (window.cordova) {
      setError(null)
      // @ts-expect-error ???
      window.cordova.plugins.barcodeScanner.scan(
        // @ts-expect-error ???
        (result) => {
          if (!result.cancelled) {
            handleScan(result.text)
          }
        },
        // @ts-expect-error ???
        (error) => {
          setError(
            new Error(
              `An error has occurred: "${error}". Please click "Cancel" below to try again. If the problem persists, please contact support.`,
            ),
          )
        },
        {
          showFlipCameraButton: true,
          showTorchButton: true,
        },
      )
    } else {
      startBarcodeScanner()
    }
  }, [handleScan, startBarcodeScanner])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-barcode-scanner-element">
      <FormElementLabelContainer
        className="ob-barcode-scanner"
        element={element}
        id={id}
        required={element.required}
      >
        {error && (
          <figure className="ob-figure">
            <div className="figure-content has-text-centered">
              <div>
                <h4 className="title is-4">Whoops...</h4>
                <p>{error.message}</p>
              </div>
            </div>
          </figure>
        )}

        {isCameraOpen ? (
          <BarcodeScanner
            id={`${id}==BARCODE_SCANNER`}
            onScan={handleScan}
            onClose={stopBarcodeScanner}
          />
        ) : (
          <div>
            <div className="field has-addons">
              <div className="control is-expanded has-icons-right">
                <input
                  type="text"
                  placeholder={element.placeholderValue}
                  id={id}
                  name={element.name}
                  className="input ob-input cypress-barcode-scanner-control has-margin-bottom-8"
                  value={text}
                  onChange={(e) =>
                    onChange(element, {
                      value: e.target.value || undefined,
                    })
                  }
                  required={element.required}
                  disabled={element.readOnly}
                  onBlur={setIsDirty}
                />
                <span className="ob-input-icon icon is-small is-right">
                  <i className="material-icons is-size-5">document_scanner</i>
                </span>
              </div>
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

            <button
              type="button"
              className="button ob-button ob-button__open is-primary cypress-start-scan-barcode-button"
              disabled={element.readOnly}
              onClick={openBarcodeScanner}
            >
              Scan Barcode
            </button>
          </div>
        )}

        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementBarcodeScanner)

type BarcodeScannerProps = {
  id: string
  onScan: (barcode: string | undefined) => void
  onClose: () => void
}

function BarcodeScanner({ id, onScan, onClose }: BarcodeScannerProps) {
  const [html5QrcodeScanner, setHtml5QrcodeScanner] =
    React.useState<Html5QrcodeScanner | null>(null)

  React.useEffect(() => {
    const verbose = true
    const newHtml5QrcodeScanner = new Html5QrcodeScanner(
      id,
      {
        fps: 20,
        qrbox: {
          width: 400,
          height: 400,
        },
      },
      verbose,
    )
    setHtml5QrcodeScanner(newHtml5QrcodeScanner)
    return () => {
      newHtml5QrcodeScanner.clear()
    }
  }, [id])

  React.useEffect(() => {
    html5QrcodeScanner?.render(
      function onScanSuccess(decodedText, decodedResult) {
        console.log(`Code matched = ${decodedText}`, decodedResult)
        onScan(decodedText)
      },
      function onScanFailure() {
        // do nothing and keep scanning
      },
    )
  }, [html5QrcodeScanner, onScan])

  return (
    <div>
      <figure className="ob-figure">
        <div id={id} />
      </figure>
      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button ob-button__cancel is-light cypress-cancel-scan-barcode-button"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
