export interface PercentCrop {
  x: number
  y: number
  width: number
  height: number
  unit: '%'
}

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
  fileType,
}: {
  croppedAreaPercent: PercentCrop
  imgSrc: string
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

  croppedCanvas.width = widthPercentAsPixels()
  croppedCanvas.height = heightPercentAsPixels()

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
