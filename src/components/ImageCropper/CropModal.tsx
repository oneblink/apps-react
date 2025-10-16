import * as React from 'react'
import ImageCropper, { getAspectRatio } from '.'
import { Area } from 'react-easy-crop'
import scrollingService from '../../services/scrolling-service'
import {
  AspectRatioButton,
  availableAspectRatios,
  AspectRatio,
} from './resource-components'

function CropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string
  onClose: () => void
  onSave: (imageArea: Area) => void
}) {
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

  const [selectedAspectRatio, setSelectedAspectRatio] =
    React.useState<AspectRatio>(availableAspectRatios[0])

  const aspectRatio = React.useMemo(
    () =>
      getAspectRatio({
        width: selectedAspectRatio.width,
        height: selectedAspectRatio.height,
      }),
    [selectedAspectRatio],
  )
  return (
    <div className="modal is-active">
      <div className="modal-background-faded"></div>
      <div className="ob-crop ob-border-radius">
        <div
          className="ob-crop__content ob-border-radius"
          // TODO: Put in css file if Blake gives the ok for this implementation
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <ImageCropper
            imgSrc={imageSrc}
            onCropComplete={setCroppedAreaPixels}
            outputAspectRatio={aspectRatio}
          />
          <AspectRatioButton
            onSelectAspectRatio={setSelectedAspectRatio}
            selectedAspectRatio={selectedAspectRatio}
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
