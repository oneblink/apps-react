import { localisationService } from '@oneblink/apps'

export default function (file: File, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const now = localisationService.formatDatetime(new Date(file.lastModified))
    const imageHeightMultiplierCoefficient = 0.0021
    const textHeightCoefficient = 20
    const backgroundMarginCoefficient = 10

    const textHeight =
      imageHeightMultiplierCoefficient * canvas.height * textHeightCoefficient

    const backgroundMargin =
      imageHeightMultiplierCoefficient *
      canvas.height *
      backgroundMarginCoefficient

    ctx.font = `${textHeight}px Arial`
    const { width: textWidth } = ctx.measureText(now)

    const backgroundWidth = backgroundMargin * 2 + textWidth
    const backgroundHeight = backgroundMargin * 2 + textHeight

    ctx.fillStyle = 'rgba(20, 20, 20, 0.6)'
    ctx.fillRect(
      canvas.width - backgroundWidth - backgroundMargin,
      canvas.height - backgroundHeight - backgroundMargin,
      backgroundWidth,
      backgroundHeight,
    )

    ctx.fillStyle = '#FFF'
    ctx.fillText(
      now,
      canvas.width - textWidth - backgroundMargin * 2,
      canvas.height - textHeight - backgroundMargin / 3,
    )
  }
}
