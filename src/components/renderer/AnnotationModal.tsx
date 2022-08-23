import * as React from 'react'
import clsx from 'clsx'
import SignatureCanvas from 'react-signature-canvas'

import useBooleanState from '../../hooks/useBooleanState'
import scrollingService from '../../services/scrolling-service'

const annotationButtonColours = [
  '#000000',
  '#ffffff',
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffee58',
  '#ffca28',
  '#ffa726',
  '#ff5722',
]

function AnnotationModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string
  onClose: () => void
  onSave: (newValue: string) => void
}) {
  const annotationContentElementRef = React.useRef<HTMLDivElement>(null)
  const bmSignaturePadRef = React.useRef<HTMLDivElement>(null)
  const signatureCanvasRef = React.useRef<SignatureCanvas>(null)

  const [isDirty, setDirty] = useBooleanState(false)
  const [penColour, setPenColour] = React.useState(annotationButtonColours[0])

  const handleCancelAnnotation = React.useCallback(() => {
    if (signatureCanvasRef.current) {
      console.log('Clearing annotation...')
      signatureCanvasRef.current.clear()
    }
    onClose()
  }, [onClose])

  const handleSaveAnnotation = React.useCallback(() => {
    if (signatureCanvasRef.current) {
      onSave(signatureCanvasRef.current.toDataURL())
    }
  }, [onSave])

  // SETTING CANVAS FROM PASSED VALUE
  React.useEffect(() => {
    const annotationContentElement = annotationContentElementRef.current
    const bmSignaturePadElement = bmSignaturePadRef.current
    const signatureCanvas = signatureCanvasRef.current
    if (
      !annotationContentElement ||
      !bmSignaturePadElement ||
      !signatureCanvas ||
      typeof imageSrc !== 'string'
    ) {
      return
    }
    const canvasElement = signatureCanvas.getCanvas()

    // Disable scrolling to allow for smooth drawing
    scrollingService.disableScrolling()

    const maxWidth = annotationContentElement.clientWidth
    const maxHeight = annotationContentElement.clientHeight

    const i = new Image()
    i.onload = function () {
      const imageWidth = i.width
      const imageHeight = i.height
      let canvasWidth = imageWidth
      let canvasHeight = imageHeight

      if (imageWidth > maxWidth || imageHeight > maxHeight) {
        const widthRatio = maxWidth / imageWidth
        const heightRatio = maxHeight / imageHeight
        const ratio = Math.min(widthRatio, heightRatio)

        canvasWidth = ratio * imageWidth
        canvasHeight = ratio * imageHeight
      }

      bmSignaturePadElement.style.width = `${canvasWidth}px`
      bmSignaturePadElement.style.height = `${canvasHeight}px`
      bmSignaturePadElement.style.backgroundSize = 'cover'
      bmSignaturePadElement.style.backgroundImage = `url(${imageSrc})`
      canvasElement.width = canvasWidth
      canvasElement.height = canvasHeight
    }
    console.log('imageSrc', imageSrc)
    i.src = imageSrc

    return () => {
      scrollingService.enableScrolling()
    }
  }, [imageSrc])

  return (
    <div className="modal is-active">
      <div className="modal-background-faded"></div>
      <div className="ob-annotation">
        <div className="ob-annotation__buttons ob-annotation__buttons-colours">
          {annotationButtonColours.map((colour, index) => {
            return (
              <button
                key={index}
                type="button"
                className={clsx(
                  'button ob-annotation__button ob-annotation__button-colour cypress-annotation-colour-button',
                  {
                    'is-selected': penColour === colour,
                  },
                )}
                onClick={() => setPenColour(colour)}
                style={{ backgroundColor: colour }}
              />
            )
          })}
        </div>
        <div
          ref={annotationContentElementRef}
          className="ob-annotation__content"
        >
          <div
            ref={bmSignaturePadRef}
            className="ob-annotation__signature-pad cypress-annotation-signature-pad"
          >
            <SignatureCanvas
              ref={signatureCanvasRef}
              clearOnResize={false}
              onEnd={setDirty}
              penColor={penColour}
            />
          </div>
        </div>
        <div className="ob-annotation__buttons ob-annotation__buttons-actions">
          <button
            type="button"
            className="button is-light ob-button ob-annotation__button ob-annotation__button-action cypress-annotation-cancel-button"
            onClick={handleCancelAnnotation}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button is-primary ob-button ob-annotation__button ob-annotation__button-action cypress-annotation-save-button"
            disabled={!isDirty}
            onClick={handleSaveAnnotation}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(AnnotationModal)
