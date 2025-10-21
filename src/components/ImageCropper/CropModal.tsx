import * as React from 'react'
import ImageCropper from '.'
import scrollingService from '../../services/scrolling-service'
import { PercentCrop } from 'react-image-crop'

function CropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string
  onClose: () => void
  onSave: (imageArea: PercentCrop) => void
}) {
  const [croppedAreaPercent, setCroppedAreaPercent] =
    React.useState<PercentCrop | null>(null)

  const handleSaveCrop = React.useCallback(async () => {
    if (!croppedAreaPercent) return

    onSave(croppedAreaPercent)
  }, [croppedAreaPercent, onSave])

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
        <div className="ob-crop__content ob-border-radius">
          <ImageCropper
            imgSrc={imageSrc}
            onCropComplete={setCroppedAreaPercent}
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
            disabled={!croppedAreaPercent}
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
