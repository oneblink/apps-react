import { localisationService } from '@oneblink/apps'

export default function (file: File, canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d')
  if (context) {
    const now = localisationService.formatDatetime(new Date(file.lastModified))
    const textHeight = 20
    context.font = `${textHeight}px Arial`
    const { width: textWidth } = context.measureText(now)
    const backgroundMargin = 10
    const backgroundPadding = backgroundMargin
    const backgroundWidth = backgroundPadding * 2 + textWidth
    const backgroundHeight = backgroundPadding * 2 + textHeight
    context.fillStyle = 'rgba(20, 20, 20, 0.6)'
    context.fillRect(
      canvas.width - backgroundWidth - backgroundMargin,
      canvas.height - backgroundHeight - backgroundMargin,
      backgroundWidth,
      backgroundHeight,
    )

    context.fillStyle = '#FFF'
    context.fillText(
      now,
      canvas.width - textWidth - backgroundPadding - backgroundMargin,
      canvas.height - 22,
    )
  }
}
