import * as React from 'react'
import { Html5Qrcode, CameraDevice } from 'html5-qrcode'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/renderer/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useLookupNotification, {
  LookupNotificationContext,
} from '../hooks/useLookupNotification'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import useLoadDataState from '../hooks/useLoadDataState'
import OnLoading from '../components/renderer/OnLoading'

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
          <BarcodeScannerSupported
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

function BarcodeScannerSupported({ id, onScan, onClose }: BarcodeScannerProps) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <BarcodeScannerFigure onClose={onClose}>
        <BarcodeScannerError
          title="Unsupported Device"
          message="Your device does not support accessing your camera."
        />
      </BarcodeScannerFigure>
    )
  }

  return (
    <BarcodeScannerCameraLoader id={id} onScan={onScan} onClose={onClose} />
  )
}

function BarcodeScannerCameraLoader({
  id,
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const [state] = useLoadDataState(Html5Qrcode.getCameras)
  switch (state.status) {
    case 'LOADING': {
      return (
        <BarcodeScannerFigure onClose={onClose}>
          <div className="figure-content has-text-centered">
            <OnLoading small />
          </div>
        </BarcodeScannerFigure>
      )
    }
    case 'ERROR': {
      return (
        <BarcodeScannerFigure onClose={onClose}>
          <BarcodeScannerError
            title="Whoops..."
            message={
              state.error.name === 'NotAllowedError'
                ? 'Cannot scan for barcodes without granting the application access to the camera.'
                : state.error.message
            }
          />
        </BarcodeScannerFigure>
      )
    }
  }

  if (!state.result.length) {
    return (
      <BarcodeScannerFigure onClose={onClose}>
        <BarcodeScannerError
          title="No Cameras Available"
          message="Your device does not have an accessible camera."
        />
      </BarcodeScannerFigure>
    )
  }

  return (
    <BarcodeScanner
      id={id}
      onScan={onScan}
      onClose={onClose}
      cameraDevices={state.result}
    />
  )
}

function BarcodeScanner({
  id,
  onScan,
  onClose,
  cameraDevices,
}: BarcodeScannerProps & {
  cameraDevices: CameraDevice[]
}) {
  const [html5Qrcode, setHtml5Qrcode] = React.useState<Html5Qrcode | null>(null)
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = React.useState(
    cameraDevices[0].id,
  )

  const handleSwitchCamera = React.useCallback(() => {
    // We will just be rotating between the available cameras.
    setSelectedCameraDeviceId((currentCameraDeviceId) => {
      const nextDeviceIndex =
        cameraDevices.findIndex(
          (cameraDevice) => cameraDevice.id === currentCameraDeviceId,
        ) + 1
      const nextDevice = cameraDevices[nextDeviceIndex] || cameraDevices[0]
      return nextDevice.id
    })
  }, [cameraDevices])

  React.useEffect(() => {
    const verbose = !!localStorage.getItem('BARCODE_SCANNER_VERBOSE')
    const newHtml5Qrcode = new Html5Qrcode(id, {
      verbose,
      formatsToSupport: undefined, // TODO add restrictions
    })
    setHtml5Qrcode(newHtml5Qrcode)
    return () => {
      newHtml5Qrcode.stop().catch((error) => {
        console.warn('Failed to stop barcode scanner', error)
      })
    }
  }, [id])

  React.useEffect(() => {
    html5Qrcode
      ?.start(
        selectedCameraDeviceId,
        {
          fps: 20,
          qrbox: {
            width: 400,
            height: 400,
          },
        },
        function onScanSuccess(decodedText, decodedResult) {
          console.log('Barcode scanner decoded result:', decodedResult)
          onScan(decodedText)
        },
        function onScanFailure() {
          // do nothing and keep scanning
        },
      )
      .catch((error) => {
        console.warn('Failed to start scanning', error)
      })
  }, [html5Qrcode, onScan, selectedCameraDeviceId])

  return (
    <BarcodeScannerFigure
      onClose={onClose}
      onSwitchCamera={cameraDevices.length > 1 ? handleSwitchCamera : undefined}
    >
      <div className="figure-content-absolute-center">
        <OnLoading small />
      </div>
      <div id={id} className="ob-figure__barcode-scanner" />
    </BarcodeScannerFigure>
  )
}

function BarcodeScannerFigure({
  onClose,
  onSwitchCamera,
  children,
}: {
  onClose: () => void
  onSwitchCamera?: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <figure className="ob-figure">{children}</figure>
      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button ob-button__cancel is-light cypress-cancel-scan-barcode-button"
          onClick={onClose}
        >
          Cancel
        </button>
        {onSwitchCamera && (
          <button
            type="button"
            className="button ob-button ob-button__switch-camera is-primary cypress-switch-camera-button"
            onClick={onSwitchCamera}
          >
            Switch Camera
          </button>
        )}
      </div>
    </div>
  )
}

function BarcodeScannerError({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="figure-content has-text-centered">
      <div>
        <h4 className="title is-4">{title}</h4>
        <p className="has-margin-bottom-6">{message}</p>
        <p>
          Please click <b>Cancel</b> below and type in the barcode value
          manually.
        </p>
      </div>
    </div>
  )
}
