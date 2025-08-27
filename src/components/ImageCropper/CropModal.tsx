import * as React from 'react'
import ImageCropper from '.'
import { Area } from 'react-easy-crop'
import scrollingService from '../../services/scrolling-service'

function CropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string
  onClose: () => void
  onSave: (imageArea: Area) => void
}) {
  const annotationContentElementRef = React.useRef<HTMLDivElement>(null)

  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<Area | null>(
    null,
  )

  const handleSaveCrop = React.useCallback(async () => {
    if (!croppedAreaPixels) return

    onSave(croppedAreaPixels)
  }, [croppedAreaPixels, onSave])

  React.useEffect(() => {
    scrollingService.disableScrolling()

    return () => {
      scrollingService.enableScrolling()
    }
  }, [])

  return (
    <div className="modal is-active">
      <div className="modal-background-faded"></div>
      <div className="ob-crop ob-border-radius">
        <div
          ref={annotationContentElementRef}
          className="ob-crop__content ob-border-radius"
        >
          <ImageCropper
            imgSrc={imageSrc}
            onCropComplete={setCroppedAreaPixels}
          />
        </div>
        <div className="ob-annotation__buttons ob-annotation__buttons-actions">
          <button
            type="button"
            className="button is-light ob-button ob-annotation__button ob-annotation__button-action cypress-crop-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button is-primary ob-button ob-annotation__button ob-annotation__button-action cypress-crop-save-button"
            disabled={!croppedAreaPixels}
            onClick={handleSaveCrop}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(CropModal)
