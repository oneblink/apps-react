import * as React from 'react'
import {
  Html5Qrcode,
  CameraDevice,
  Html5QrcodeSupportedFormats,
  Html5QrcodeCameraScanConfig,
} from 'html5-qrcode'
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
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import MaterialIcon from '../components/MaterialIcon'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'

type Props = {
  id: string
  element: FormTypes.BarcodeScannerElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
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
  autocompleteAttributes,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
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
            restrictedBarcodeTypes={
              element.restrictBarcodeTypes
                ? element.restrictedBarcodeTypes
                : undefined
            }
            onScan={handleScan}
            onClose={stopBarcodeScanner}
            aria-describedby={ariaDescribedby}
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
                  aria-describedby={ariaDescribedby}
                  autoComplete={autocompleteAttributes}
                  aria-required={element.required}
                />
                <span className="ob-input-icon icon is-small is-right">
                  <MaterialIcon className="is-size-5">
                    document_scanner
                  </MaterialIcon>
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
                overrideRequiredMessage={undefined}
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
          <FormElementValidationMessage message={validationMessage} />
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementBarcodeScanner)

type BarcodeScannerProps = {
  id: string
  restrictedBarcodeTypes: FormTypes.BarcodeScannerElement['restrictedBarcodeTypes']
  onScan: (barcode: string | undefined) => void
  onClose: () => void
  'aria-describedby'?: string
}

function BarcodeScannerSupported(props: BarcodeScannerProps) {
  const { onClose } = props
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

  return <BarcodeScannerCameraLoader {...props} />
}

function BarcodeScannerCameraLoader(props: BarcodeScannerProps) {
  const { onClose } = props
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

  return <BarcodeScanner {...props} cameraDevices={state.result} />
}

function BarcodeScanner({
  id,
  restrictedBarcodeTypes,
  onScan,
  onClose,
  cameraDevices,
  ...props
}: BarcodeScannerProps & {
  cameraDevices: CameraDevice[]
}) {
  const formatsToSupport = React.useMemo(() => {
    return restrictedBarcodeTypes?.reduce<Html5QrcodeSupportedFormats[]>(
      (memo, barcodeType) => {
        const format =
          Html5QrcodeSupportedFormats[
            barcodeType as keyof typeof Html5QrcodeSupportedFormats
          ]
        if (format !== undefined) {
          memo.push(format)
        }
        return memo
      },
      [],
    )
  }, [restrictedBarcodeTypes])

  const [scannerState, setScannerState] = React.useState<
    { state: 'loading' } | { state: 'ready' } | { state: 'error'; error: Error }
  >({ state: 'loading' })

  React.useEffect(() => {
    setScannerState({ state: 'loading' })

    const html5Qrcode = new Html5Qrcode(id, {
      verbose: !!localStorage.getItem('BARCODE_SCANNER_VERBOSE'),
      formatsToSupport: formatsToSupport?.length ? formatsToSupport : undefined,
    })

    const backFacingCamera = cameraDevices.find((device) =>
      /back|rear|environment/i.test(device.label),
    )
    const preferredCamera = backFacingCamera ?? cameraDevices[0]
    const scanConfig: Html5QrcodeCameraScanConfig = {
      fps: 20,
      aspectRatio: 1,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const size = Math.min(
          250,
          Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75),
        )
        return { width: size, height: size }
      },
    }

    const onScanSuccess = (decodedText: string, decodedResult: unknown) => {
      console.log('Barcode scanner decoded result:', decodedResult)
      onScan(decodedText)
    }
    const onScanFailure = () => {
      // do nothing and keep scanning
    }

    const abortController = new AbortController()

    const begin = async () => {
      try {
        // Attempt to start with the back facing camera
        await html5Qrcode.start(
          { deviceId: preferredCamera.id },
          scanConfig,
          onScanSuccess,
          onScanFailure,
        )
        if (abortController.signal.aborted) {
          return
        }
        setScannerState({ state: 'ready' })
      } catch (deviceIdError) {
        if (abortController.signal.aborted) {
          return
        }
        console.warn('Failed to start scanning with deviceId', deviceIdError)
        try {
          // If the back facing camera is not available, try to start in environment mode
          await html5Qrcode.start(
            { facingMode: 'environment' },
            scanConfig,
            onScanSuccess,
            onScanFailure,
          )
          if (abortController.signal.aborted) {
            return
          }
          setScannerState({ state: 'ready' })
        } catch (facingModeError) {
          if (abortController.signal.aborted) {
            return
          }
          console.warn('Failed to start scanning', facingModeError)
          setScannerState({
            state: 'error',
            error:
              facingModeError instanceof Error
                ? facingModeError
                : new Error(String(facingModeError)),
          })
        }
      }
    }

    begin()

    return () => {
      abortController.abort()
      if (!html5Qrcode.isScanning) {
        return
      }
      try {
        html5Qrcode.stop().catch((error) => {
          console.warn('Failed to stop barcode scanner', error)
        })
      } catch (error) {
        console.warn('Failed to stop barcode scanner', error)
      }
    }
  }, [cameraDevices, formatsToSupport, id, onScan])

  return (
    <BarcodeScannerFigure onClose={onClose}>
      {scannerState.state === 'loading' && (
        <div className="figure-content-absolute-center">
          <OnLoading small />
        </div>
      )}
      {scannerState.state === 'error' && (
        <BarcodeScannerError
          title="Whoops..."
          message={scannerState.error.message}
        />
      )}
      <div
        id={id}
        className="ob-figure__barcode-scanner"
        aria-describedby={props['aria-describedby']}
      />
    </BarcodeScannerFigure>
  )
}

function BarcodeScannerFigure({
  onClose,
  children,
}: {
  onClose: () => void
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
    <div className="figure-content has-text-centered" role="alert">
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
