import * as React from 'react'
import clsx from 'clsx'
import jsQR from 'jsqr'

import OnLoading from '../components/OnLoading'
import CopyToClipboardButton from '../components/CopyToClipboardButton'
import quaggaReader from '../services/barcode-readers/quagger.js'
import useBooleanState from '../hooks/useBooleanState'
import LookupButton from '../components/LookupButton'
import { FormTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/FormElementLabelContainer'
import { Sentry } from '@oneblink/apps'

const MS_BETWEEN_IMAGE_PROCESSING = 10
const fadedSquareWidthInPixels = 200
const fadedSquareHeightInPixels = 150
const redLineHeightInPixels = 1

type Props = {
  id: string
  element: FormTypes.BarcodeScannerElement
  value: unknown | undefined
  onChange: FormElementValueChangeHandler<string>
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
  element: FormTypes.BarcodeScannerElement
  onScan: (barcode: string | undefined) => void
  onClose: () => void
}

function BarcodeScanner({ element, onScan, onClose }: BarcodeScannerProps) {
  const videoElementRef = React.useRef<HTMLVideoElement>(null)
  const figureElementRef = React.useRef<HTMLDivElement>(null)

  const [
    { isLoading = false, selectedDeviceId, error },
    setState,
  ] = React.useState<{
    isLoading: boolean
    selectedDeviceId: string | undefined
    error: Error | undefined
  }>({
    isLoading: true,
    selectedDeviceId: undefined,
    error: undefined,
  })
  const [camera, setCamera] = React.useState<HTML5Camera | null>(null)

  const setError = React.useCallback((error: Error) => {
    setState({
      error,
      isLoading: false,
      selectedDeviceId: undefined,
    })
  }, [])

  // Create timeout using $timeout outside of the scan function so
  // so that we can cancel it when navigating away from screen
  const scanImageForBarcode = React.useCallback(
    (videoElement, waitInMS, options, checkStop) => {
      const restrictedBarcodeTypes = element.restrictedBarcodeTypes || []
      // Using $timeout here instead of $interval as we dont know
      // exactly how long each processing of the image will take.
      setTimeout(async () => {
        if (checkStop()) return
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

        if (checkStop()) return

        scanImageForBarcode(
          videoElement,
          MS_BETWEEN_IMAGE_PROCESSING,
          options,
          checkStop,
        )
      }, waitInMS)
    },
    [element.restrictBarcodeTypes, element.restrictedBarcodeTypes, onScan],
  )

  const switchCamera = React.useCallback(() => {
    if (!camera) {
      return
    }

    // We will just be rotating between the available camera.
    const nextDeviceIndex =
      camera.availableDevices.findIndex(
        (mediaDeviceInfo) => mediaDeviceInfo.deviceId === camera.activeDeviceId,
      ) + 1
    const nextDevice =
      camera.availableDevices[nextDeviceIndex] || camera.availableDevices[0]
    setState({
      error: undefined,
      isLoading: true,
      selectedDeviceId: nextDevice.deviceId,
    })
  }, [camera])

  React.useEffect(() => {
    if (!videoElementRef.current) {
      return
    }

    const newCamera = new HTML5Camera(videoElementRef.current)
    setCamera(newCamera)

    return () => {
      newCamera.close()
    }
  }, [])

  React.useEffect(() => {
    if (
      !camera ||
      error ||
      // If attempting to open the device that is currently open,
      // we will not attempt to open again.
      (selectedDeviceId && camera.activeDeviceId === selectedDeviceId)
    ) {
      return
    }

    let ignore = false

    ;(async () => {
      try {
        const videoElement = videoElementRef.current
        const figureElement = figureElementRef.current
        if (!videoElement || !figureElement) {
          return
        }

        console.log('Opening camera with:', selectedDeviceId || 'UNKNOWN')
        await camera.open(selectedDeviceId)

        if (ignore) {
          return
        }

        setState({
          error: undefined,
          isLoading: false,
          selectedDeviceId,
        })

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
        scanImageForBarcode(
          videoElement,
          250,
          {
            sourceX: left,
            sourceY: top,
            sourceWidth: fadedSquareWidth,
            sourceHeight: fadedSquareWidth,
          },
          () => ignore,
        )
      } catch (error) {
        if (ignore) {
          return
        }
        Sentry.captureException(error)
        console.warn('Error while attempting to open camera', error)
        switch (error.name) {
          case 'NotSupportedError': {
            setError(
              new Error(
                'Your browser does not support accessing your camera. Please click "Cancel" below and type in the barcode value manually.',
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
      }
    })()

    return () => {
      ignore = true
    }
  }, [camera, error, scanImageForBarcode, selectedDeviceId, setError])

  return (
    <div>
      <figure className="ob-figure" ref={figureElementRef}>
        <div className="figure-content has-text-centered">
          {isLoading && <OnLoading small />}

          {!!error && (
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
        {(camera?.availableDevices.length || 1) > 1 && (
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

class HTML5Camera {
  availableDevices: MediaDeviceInfo[]
  htmlVideoElement: HTMLVideoElement
  mediaStream: MediaStream | undefined

  constructor(htmlVideoElement: HTMLVideoElement) {
    this.htmlVideoElement = htmlVideoElement
    this.availableDevices = []
    this.mediaStream = undefined
  }

  get activeDeviceId(): string | undefined {
    if (this.mediaStream) {
      const [activeMediaStreamTrack] = this.mediaStream.getTracks()
      return activeMediaStreamTrack?.getSettings()?.deviceId
    }
  }

  async open(deviceId?: string) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error()
      error.name = 'NotSupportedError'
      throw error
    }

    this.close()

    const constraints = {
      video: {
        facingMode: deviceId ? undefined : 'environment',
        deviceId: deviceId ? { exact: deviceId } : undefined,
      },
    }
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    this.mediaStream = mediaStream
    this.htmlVideoElement.srcObject = mediaStream

    if (!this.availableDevices.length) {
      const availableDevices = await navigator.mediaDevices.enumerateDevices()
      this.availableDevices = availableDevices.filter(
        (mediaDeviceInfo) =>
          mediaDeviceInfo.kind === 'videoinput' && !!mediaDeviceInfo.deviceId,
      )
    }

    await new Promise((resolve) =>
      this.htmlVideoElement.addEventListener('canplay', resolve, {
        once: true,
      }),
    )
  }

  close() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop()
      })
      this.mediaStream = undefined
    }
  }
}
