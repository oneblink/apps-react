import * as React from 'react'
import clsx from 'clsx'
import bmCameraFactory from '@blinkmobile/camera'
import jsQR from 'jsqr'

import OnLoading from '../components/OnLoading'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import quaggaReader from '../services/barcode-readers/quagger.js'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import useIsMounted from '../hooks/useIsMounted'
import { FormTypes } from '@oneblink/types'

const MS_BETWEEN_IMAGE_PROCESSING = 10
const fadedSquareWidthInPixels = 200
const fadedSquareHeightInPixels = 150
const redLineHeightInPixels = 1

type Props = {
  id: string
  element: FormTypes.BarcodeScannerElement
  value: unknown | undefined
  onChange: (
    formElement: FormTypes.FormElement,
    newValue: string | undefined,
  ) => void
  displayValidationMessage: boolean
  validationMessage: string | undefined
}

function FormElementBarcodeScanner({
  id,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
}: Props) {
  const [isDirty, setIsDirty] = useBooleanState(false)
  const [
    isCameraOpen,
    startBarcodeScanner,
    stopBarcodeScanner,
  ] = useBooleanState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleScan = React.useCallback(
    (newValue: string | undefined) => {
      setIsDirty()
      onChange(element, newValue)
      stopBarcodeScanner()
    },
    [element, onChange, setIsDirty, stopBarcodeScanner],
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

  const text = typeof value === 'string' ? value : ''
  return (
    <div className="cypress-barcode-scanner-element">
      <div className="ob-form__element ob-barcode-scanner">
        <label
          className={clsx('label ob-label', {
            'is-required': element.required,
          })}
          htmlFor={id}
        >
          {element.label}
        </label>

        {error && (
          <figure>
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
            element={element}
            onScan={handleScan}
            onClose={stopBarcodeScanner}
          />
        ) : (
          <div>
            <div className="field has-addons">
              <div className="control is-expanded">
                <input
                  type="text"
                  placeholder={element.placeholderValue}
                  id={id}
                  name={element.name}
                  className="input ob-input cypress-barcode-scanner-control has-margin-bottom-8"
                  value={text}
                  onChange={(e) =>
                    onChange(element, e.target.value || undefined)
                  }
                  required={element.required}
                  disabled={element.readOnly}
                  onBlur={setIsDirty}
                />
              </div>
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

        {(isDirty || displayValidationMessage) && !!validationMessage && (
          <div role="alert">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(FormElementBarcodeScanner)

type BarcodeScannerProps = {
  element: FormTypes.BarcodeScannerElement
  onScan: (barcode: string | undefined) => void
  onClose: () => void
}

function BarcodeScanner({ element, onScan, onClose }: BarcodeScannerProps) {
  const isMounted = useIsMounted()
  const videoElementRef = React.useRef<HTMLVideoElement>(null)
  const figureElementRef = React.useRef<HTMLDivElement>(null)

  const [selectedDeviceIndex, setSelectedDeviceIndex] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMultipleDevices, setHasMultipleDevices] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [camera, setCamera] = React.useState<ReturnType<
    typeof bmCameraFactory
  > | null>(null)

  // Create timeout using $timeout outside of the scan function so
  // so that we can cancel it when navigating away from screen
  const scanImageForBarcode = React.useCallback(
    (videoElement, waitInMS, options) => {
      const restrictedBarcodeTypes = element.restrictedBarcodeTypes || []
      // Using $timeout here instead of $interval as we dont know
      // exactly how long each processing of the image will take.
      setTimeout(async () => {
        if (!camera) return
        const canvasElement = document.createElement('canvas')

        canvasElement.width = options.sourceWidth
        canvasElement.height = options.sourceHeight

        const canvasContext = canvasElement.getContext('2d')
        if (canvasContext) {
          canvasContext.drawImage(
            videoElement,
            options.sourceX,
            options.sourceY,
            canvasElement.width,
            canvasElement.height,
            0,
            0,
            canvasElement.width,
            canvasElement.height,
          )

          if (
            !element.restrictBarcodeTypes ||
            (element.restrictedBarcodeTypes || []).indexOf('qr_reader') > -1
          ) {
            const imageData = canvasContext.getImageData(
              0,
              0,
              canvasElement.width,
              canvasElement.height,
            )

            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: 'dontInvert',
              },
            )

            if (code) {
              return onScan(code.data)
            }
          }
        }

        if (
          !element.restrictBarcodeTypes ||
          !(
            restrictedBarcodeTypes.length === 1 &&
            restrictedBarcodeTypes[0] === 'qr_reader'
          )
        ) {
          const base64Image = canvasElement.toDataURL('image/png')
          const quaggaResult = await quaggaReader(
            base64Image,
            restrictedBarcodeTypes,
          )
          if (quaggaResult) {
            return onScan(quaggaResult)
          }
        }

        if (isMounted.current) {
          scanImageForBarcode(
            videoElement,
            MS_BETWEEN_IMAGE_PROCESSING,
            options,
          )
        }
      }, waitInMS)
    },
    [
      camera,
      element.restrictBarcodeTypes,
      element.restrictedBarcodeTypes,
      isMounted,
      onScan,
    ],
  )

  const switchCamera = React.useCallback(() => {
    if (camera) {
      // We will just be rotating between the available camera.
      const nextDeviceIndex = selectedDeviceIndex + 1
      if (camera.availableDevices[selectedDeviceIndex]) {
        setSelectedDeviceIndex(nextDeviceIndex)
      } else {
        setSelectedDeviceIndex(0)
      }
    }
  }, [camera, selectedDeviceIndex])

  React.useEffect(() => {
    if (camera) {
      const nextDevice = camera.availableDevices[selectedDeviceIndex]
      if (nextDevice) {
        camera.useDevice(nextDevice)
      }
    }
  }, [camera, selectedDeviceIndex])

  React.useEffect(() => {
    if (!videoElementRef.current) {
      return
    }

    const newCamera = bmCameraFactory(videoElementRef.current)
    setCamera(newCamera)

    return () => {
      newCamera.close()
    }
  }, [])

  React.useEffect(() => {
    if (!camera) {
      return
    }

    setIsLoading(true)
    setError(null)

    let ignore = false

    ;(async () => {
      try {
        const videoElement = videoElementRef.current
        const figureElement = figureElementRef.current
        if (!videoElement || !figureElement) {
          return
        }

        await camera.open()
        await camera.getDevices()

        if (ignore) {
          return
        }

        setIsLoading(false)

        const newHasMultipleDevices = camera.availableDevices.length > 1

        setHasMultipleDevices(newHasMultipleDevices)

        // Bit of hack to get the back camera opening first
        // on most devices (tested by Matt) that the label
        // includes the work "back" or "Back".
        if (newHasMultipleDevices) {
          const backCameraIndex = camera.availableDevices.findIndex(
            (device) => {
              return (
                typeof device.label === 'string' &&
                device.label.toLowerCase().indexOf('back') > -1
              )
            },
          )
          if (backCameraIndex !== -1) {
            setSelectedDeviceIndex(backCameraIndex)
          }
        }

        // @ts-expect-error ???
        const fadedSquareElement: HTMLDivElement = figureElement.getElementsByClassName(
          'ob-barcode-scanner__square',
        )[0]
        // @ts-expect-error ???
        const redLineElement: HTMLDivElement = figureElement.getElementsByClassName(
          'ob-barcode-scanner__line',
        )[0]
        console.log('videoElement Width pixels', videoElement.clientWidth)
        console.log('videoElement Height pixels', videoElement.clientHeight)
        console.log('videoElement Width', videoElement.videoWidth)
        console.log('videoElement Height', videoElement.videoHeight)

        // Faded Square needs its values set in pixels
        const fadedSquareLeftInPixels =
          (videoElement.clientWidth - fadedSquareWidthInPixels) / 2
        console.log('fadedSquareLeftInPixels', fadedSquareLeftInPixels)
        const fadedSquareTopInPixels =
          (videoElement.clientHeight - fadedSquareHeightInPixels) / 2
        console.log('fadedSquareTopInPixels', fadedSquareTopInPixels)

        fadedSquareElement.style.borderBottom = `${fadedSquareTopInPixels}px`
        fadedSquareElement.style.borderTop = `${fadedSquareTopInPixels}px`
        fadedSquareElement.style.borderLeft = `${fadedSquareLeftInPixels}px`
        fadedSquareElement.style.borderRight = `${fadedSquareLeftInPixels}px`
        fadedSquareElement.style.borderColor = 'rgba(0, 0, 0, 0.25)'
        fadedSquareElement.style.borderStyle = 'solid'

        redLineElement.style.height = `${redLineHeightInPixels}px`
        redLineElement.style.top = `${
          (videoElement.clientHeight - redLineHeightInPixels) / 2
        }px`
        redLineElement.style.left = `${fadedSquareLeftInPixels}px`
        redLineElement.style.right = `${fadedSquareLeftInPixels}px`

        // Need to calculate the actual width, which is not in pixels
        const ratio = videoElement.videoWidth / videoElement.clientWidth
        console.log('pixel to video Ratio', ratio)

        const left = ratio * fadedSquareLeftInPixels
        console.log('left in video measurement', left)
        const top = ratio * fadedSquareTopInPixels
        console.log('top in video measurement', top)

        const fadedSquareWidth = fadedSquareWidthInPixels * ratio
        console.log('red square in video measurement', fadedSquareWidth)

        // Wait a little before scanning the first image
        // to prevent image processing staring before
        // camera is ready.
        scanImageForBarcode(videoElement, 250, {
          sourceX: left,
          sourceY: top,
          sourceWidth: fadedSquareWidth,
          sourceHeight: fadedSquareWidth,
        })
      } catch (error) {
        if (ignore) {
          return
        }
        console.warn('Error while attempting to open camera', error)
        switch (error.name) {
          case 'NotSupportedError': {
            setError(
              new Error(
                'You browser does not support accessing your camera. Please click "Cancel" below and type in the barcode value manually.',
              ),
            )
            break
          }
          case 'NotAllowedError': {
            setError(
              new Error(
                'Cannot scan for barcodes without granting the application access to the camera. Please click "Cancel" below to try again.',
              ),
            )
            break
          }
          default: {
            setError(
              new Error(
                'An unknown error has occurred, please click "Cancel" below to try again. If the problem persists, please contact support.',
              ),
            )
          }
        }
        setIsLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [camera, scanImageForBarcode])

  return (
    <div>
      <figure ref={figureElementRef}>
        <div className="figure-content has-text-centered">
          {isLoading && <OnLoading small />}

          {error && (
            <div>
              <h4 className="title is-4">Whoops...</h4>
              <p>{error.message}</p>
            </div>
          )}

          <div
            className={clsx('is-relative', {
              'is-hidden': isLoading || error,
            })}
          >
            <div className="ob-barcode-scanner__square"></div>
            <div className="ob-barcode-scanner__line"></div>
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              className="ob-barcode-scanner__video"
            />
          </div>
        </div>
      </figure>

      <div className="buttons ob-buttons">
        <button
          type="button"
          className="button ob-button ob-button__cancel is-light cypress-cancel-scan-barcode-button"
          onClick={onClose}
        >
          Cancel
        </button>
        {hasMultipleDevices && (
          <button
            type="button"
            className="button ob-button ob-button__switch-camera is-primary cypress-switch-camera-button"
            onClick={switchCamera}
          >
            Switch Camera
          </button>
        )}
      </div>
    </div>
  )
}
