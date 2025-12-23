import React, { memo, useEffect } from 'react'
import ReactImageCrop, { Crop, PercentCrop } from 'react-image-crop'
import { CropContainer } from './resource-components'

import clsx from 'clsx'
export { PercentCrop }
const defaultCrop: PercentCrop = {
  unit: '%',
  height: 100,
  width: 100,
  x: 0,
  y: 0,
}

const getDefaultCropFromAspectRatio = ({
  outputAspectRatio,
  imageWidth,
  imageHeight,
}: {
  outputAspectRatio: number
  imageWidth: number
  imageHeight: number
}): PercentCrop => {
  const imageAspect = imageWidth / imageHeight

  // Compute the largest rectangle that fits within the image and matches the aspect ratio
  let width: number
  let height: number
  if (imageAspect >= outputAspectRatio) {
    // Image is wider than desired aspect: constrain width by the height
    height = 100
    const widthInPixels = imageHeight * outputAspectRatio
    // as percent
    width = (widthInPixels / imageWidth) * 100
  } else {
    // Image is taller/narrower than desired aspect: constrain height by the width
    width = 100
    const heightInPixels = imageWidth * outputAspectRatio
    // as percent
    height = (heightInPixels / imageHeight) * 100
  }

  // Center the crop
  const x = Math.round((100 - width) / 2)
  const y = Math.round((100 - height) / 2)

  return {
    unit: '%',
    width,
    height,
    x,
    y,
  }
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
  cropperHeight?: number
}) => {
  const cropperWrapperRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)

  const [fullHeight, setFullHeight] = React.useState(false)

  const [crop, setCrop] = React.useState<Crop | undefined>(() =>
    outputAspectRatio ? undefined : defaultCrop,
  )

  const handleSetCrop = React.useCallback((_: unknown, c: PercentCrop) => {
    setCrop(c)
  }, [])

  const handleCropComplete = React.useCallback(
    (_: unknown, c: PercentCrop) => {
      onCropComplete(c)
    },
    [onCropComplete],
  )

  const handleLoadImage = React.useCallback(
    ({ currentTarget }: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!outputAspectRatio) return
      setCrop(
        getDefaultCropFromAspectRatio({
          outputAspectRatio,
          imageWidth: currentTarget.width,
          imageHeight: currentTarget.height,
        }),
      )
    },
    [outputAspectRatio],
  )

  // Resize magic to account for images that are larger than the dialog can hold
  useEffect(() => {
    if (imageRef.current && cropperWrapperRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!cropperWrapperRef.current) continue

          const imageElHeight = entry.contentRect.height
          const cropperWrapperHeight = cropperWrapperRef.current.clientHeight

          if (Math.ceil(imageElHeight) < Math.ceil(cropperWrapperHeight)) {
            setFullHeight(false)
          } else {
            setFullHeight(true)
          }
        }
      })
      resizeObserver.observe(imageRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [imageRef])

  return (
    <div className="ob-cropper__container">
      <CropContainer
        className="ob-cropper__cropper-wrapper"
        height={cropperHeight}
        ref={cropperWrapperRef}
      >
        <ReactImageCrop
          crop={crop}
          aspect={outputAspectRatio}
          onChange={handleSetCrop}
          onComplete={handleCropComplete}
          disabled={disabled}
          className={clsx('ob-cropper__cropper', {
            'ob-cropper__cropper-full-height': fullHeight,
          })}
          ruleOfThirds
          keepSelection
        >
          <img
            src={imgSrc}
            className="ob-cropper__image"
            onLoad={handleLoadImage}
            ref={imageRef}
          />
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
