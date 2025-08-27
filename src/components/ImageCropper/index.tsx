import React, { memo, useMemo } from 'react'
import Cropper, { Area, Point, CropperProps } from 'react-easy-crop'
import {
  CropContainer,
  ZoomSlider,
  SLIDER_WHEEL_INTERVAL_VALUE,
} from './resource-components'

const defaultZoom = 1
const defaultCrop = { x: 0, y: 0 }

const emptyFn = () => {}

// 2. Fix up styling and classes
const ImageCropper = ({
  imgSrc,
  disabled,
  onCropComplete,
  outputAspectRatio,
  zoomWithScroll,
  cropperStyles,
  cropperHeight,
}: {
  imgSrc: string
  disabled?: boolean
  onCropComplete: (croppedAreaPixels: Area) => void
  outputAspectRatio?: number
  zoomWithScroll?: boolean
  cropperStyles?: CropperProps['style']
  cropperHeight?: number
}) => {
  const [crop, setCrop] = React.useState<Point>(defaultCrop)
  const [zoom, setZoom] = React.useState(defaultZoom)
  const [image, setImage] = React.useState<HTMLImageElement | null>(null)

  React.useEffect(() => {
    if (outputAspectRatio) {
      // If we have a desired aspect ratio, we dont need to get it from the current image
      return
    }
    createImage(imgSrc)
      .then(setImage)
      .catch((error) => {
        console.error(
          'Error loading image to get aspect ratio for cropping',
          error,
        )
      })
  }, [outputAspectRatio, imgSrc])

  const calculatedAspectRatio = useMemo(() => {
    if (outputAspectRatio) {
      return outputAspectRatio
    }
    if (image) {
      return getAspectRatio({
        width: image.width,
        height: image.height,
      })
    }
  }, [outputAspectRatio, image])

  return (
    <div className="ob-cropper__container">
      <CropContainer
        className="ob-cropper__cropper-wrapper"
        height={cropperHeight}
      >
        <Cropper
          image={imgSrc}
          crop={crop}
          zoom={zoom}
          aspect={calculatedAspectRatio}
          onCropChange={disabled ? emptyFn : setCrop}
          onCropComplete={(...args) => {
            if (disabled) {
              return
            }
            onCropComplete(args[1])
          }}
          onZoomChange={setZoom}
          zoomSpeed={SLIDER_WHEEL_INTERVAL_VALUE}
          zoomWithScroll={zoomWithScroll}
          classes={{
            containerClassName: 'ob-border-radius',
          }}
          style={cropperStyles}
        />
      </CropContainer>
      <div className="ob-cropper__zoom-slider-wrapper">
        <ZoomSlider value={zoom} setValue={setZoom} disabled={disabled} />
      </div>
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
  croppedAreaPixels,
  imgSrc,
  // width,
  // height,
  fileType,
}: {
  croppedAreaPixels: Area
  imgSrc: string
  // width: number
  // height: number
  fileType?: string
}): Promise<Blob | null> => {
  if (!croppedAreaPixels || !imgSrc) {
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
  croppedCanvas.width = croppedAreaPixels.width
  croppedCanvas.height = croppedAreaPixels.height

  // Draw the cropped source image onto the destination canvas
  croppedCtx.drawImage(
    canvas,
    // source x
    croppedAreaPixels.x,
    // source y
    croppedAreaPixels.y,
    // source width
    croppedAreaPixels.width,
    // source height
    croppedAreaPixels.height,
    // destination x
    0,
    // destination y
    0,
    // destination width
    croppedAreaPixels.width,
    // destination height
    croppedAreaPixels.height,
  )

  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(file)
    }, fileType)
  })
}
