import React, { memo } from 'react'
import ReactImageCrop, {
  Crop,
  PercentCrop,
  ReactCropProps,
} from 'react-image-crop'
import { CropContainer } from './resource-components'
import 'react-image-crop/src/ReactCrop.scss'

const defaultCrop: PercentCrop = {
  unit: '%',
  height: 100,
  width: 100,
  x: 0,
  y: 0,
}

const ImageCropper = ({
  imgSrc,
  disabled,
  onCropComplete,
  outputAspectRatio,
  cropperHeight,
}: {
  imgSrc: string
  disabled?: boolean
  onCropComplete: (croppedAreaPixels: PercentCrop) => void
  outputAspectRatio?: number
  cropperStyles?: ReactCropProps['style']
  cropperHeight?: number
}) => {
  const [crop, setCrop] = React.useState<Crop>(defaultCrop)

  const handleSetCrop = React.useCallback((_, c: PercentCrop) => {
    setCrop(c)
  }, [])

  const handleCropComplete = React.useCallback(
    (_, c: PercentCrop) => {
      onCropComplete(c)
    },
    [onCropComplete],
  )

  return (
    <div className="ob-cropper__container">
      <CropContainer
        className="ob-cropper__cropper-wrapper"
        height={cropperHeight}
      >
        <ReactImageCrop
          crop={crop}
          aspect={outputAspectRatio}
          onChange={handleSetCrop}
          onComplete={handleCropComplete}
          disabled={disabled}
          className="ob-cropper__cropper"
          ruleOfThirds
          keepSelection
        >
          <img src={imgSrc} className="ob-cropper__image" />
        </ReactImageCrop>
      </CropContainer>
    </div>
  )
}

export default memo(ImageCropper)

export const getAspectRatio = ({
  width,
  height,
}: {
  width: number
  height: number
}) => width / height

const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.onerror = (error) => {
      reject(error)
    }
    image.src = url
    return image
  })
}

export const generateCroppedImageBlob = async ({
  croppedAreaPercent,
  imgSrc,
  size,
  fileType,
}: {
  croppedAreaPercent: PercentCrop
  imgSrc: string
  /**
   * If provided, the cropped image will be resized to the given size. If not
   * provided, the cropped image will be the same size as the cropped portion of
   * the source image.
   */
  size?: {
    width: number
    height: number
  }
  fileType?: string
}): Promise<Blob | null> => {
  if (!croppedAreaPercent || !imgSrc) {
    return null
  }
  // Source image/canvas
  const image = await createImage(imgSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  canvas.width = image.width
  canvas.height = image.height
  ctx.drawImage(image, 0, 0)

  // Destination image/canvas
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) {
    return null
  }

  const widthPercentAsPixels = () =>
    (image.width / 100) * croppedAreaPercent.width
  const heightPercentAsPixels = () =>
    (image.height / 100) * croppedAreaPercent.height

  const sourceXPercentAsPixels = () =>
    (image.width / 100) * croppedAreaPercent.x
  const sourceYPercentAsPixels = () =>
    (image.height / 100) * croppedAreaPercent.y

  croppedCanvas.width = size?.width ?? widthPercentAsPixels()
  croppedCanvas.height = size?.height ?? heightPercentAsPixels()

  // Draw the cropped source image onto the destination canvas
  croppedCtx.drawImage(
    canvas,
    // source x
    sourceXPercentAsPixels(),
    // source y
    sourceYPercentAsPixels(),
    // source width
    widthPercentAsPixels(),
    // source height
    heightPercentAsPixels(),
    // destination x
    0,
    // destination y
    0,
    // destination width
    croppedCanvas.width,
    // destination height
    croppedCanvas.height,
  )

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(file)
    }, fileType)
  })
}
