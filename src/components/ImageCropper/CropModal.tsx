import * as React from 'react'
import scrollingService from '../../services/scrolling-service'
import { PercentCrop } from '.'

const HANDLE_SIZE = 8
type Handle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | 'null'

function getHandleUnderMouse(
  rect: { x: number; y: number; width: number; height: number },
  mouseX: number,
  mouseY: number,
): Handle {
  const { x, y, width, height } = rect
  const handles: Record<Handle, { hx: number; hy: number }> = {
    nw: { hx: x, hy: y },
    n: { hx: x + width / 2, hy: y },
    ne: { hx: x + width, hy: y },
    w: { hx: x, hy: y + height / 2 },
    e: { hx: x + width, hy: y + height / 2 },
    sw: { hx: x, hy: y + height },
    s: { hx: x + width / 2, hy: y + height },
    se: { hx: x + width, hy: y + height },
    null: { hx: -100, hy: -100 },
  }

  for (const [handle, { hx, hy }] of Object.entries(handles)) {
    if (
      mouseX >= hx - HANDLE_SIZE / 2 &&
      mouseX <= hx + HANDLE_SIZE / 2 &&
      mouseY >= hy - HANDLE_SIZE / 2 &&
      mouseY <= hy + HANDLE_SIZE / 2
    ) {
      return handle as Handle
    }
  }
  return 'null'
}

function getCursorForHandle(handle: Handle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize'
    case 'ne':
    case 'sw':
      return 'nesw-resize'
    case 'n':
    case 's':
      return 'ns-resize'
    case 'e':
    case 'w':
      return 'ew-resize'
    default:
      return 'default'
  }
}

function CropModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string
  onClose: () => void
  onSave: (imageArea: PercentCrop) => void
}) {
  const cropContentRef = React.useRef<HTMLDivElement>(null)
  const cropBackgroundRef = React.useRef<HTMLDivElement>(null)

  const [state, setState] = React.useState<{
    rect?: { x: number; y: number; width: number; height: number }
    isDragging: boolean
    dragOffset: { x: number; y: number }
    resizeHandle: Handle
  }>({
    rect: undefined,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    resizeHandle: 'null',
  })

  const { rect } = state

  const handleSaveCrop = React.useCallback(() => {
    const cropDiv = cropBackgroundRef.current
    if (!rect || !cropDiv) return
    onSave({
      x: (rect.x / cropDiv.clientWidth) * 100,
      y: (rect.y / cropDiv.clientHeight) * 100,
      width: (rect.width / cropDiv.clientWidth) * 100,
      height: (rect.height / cropDiv.clientHeight) * 100,
      unit: '%',
    })
  }, [onSave, rect])

  // Setup image background
  React.useEffect(() => {
    const cropContentElement = cropContentRef.current
    const cropBackgroundElement = cropBackgroundRef.current
    if (
      !cropContentElement ||
      !cropBackgroundElement ||
      typeof imageSrc !== 'string'
    )
      return

    scrollingService.disableScrolling()
    const maxWidth = cropContentElement.clientWidth
    const maxHeight = cropContentElement.clientHeight

    const img = new Image()
    img.onload = function () {
      let width = img.width
      let height = img.height
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      cropBackgroundElement.style.width = `${width}px`
      cropBackgroundElement.style.height = `${height}px`
      cropBackgroundElement.style.backgroundSize = 'cover'
      cropBackgroundElement.style.backgroundImage = `url(${imageSrc})`
    }
    img.src = imageSrc

    return () => scrollingService.enableScrolling()
  }, [imageSrc])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    const bg = cropBackgroundRef.current
    if (!bg) return
    const rectBounds = bg.getBoundingClientRect()
    const x = e.clientX - rectBounds.left
    const y = e.clientY - rectBounds.top

    if (rect) {
      const handle = getHandleUnderMouse(rect, x, y)
      if (handle !== 'null') {
        setState((s) => ({ ...s, resizeHandle: handle }))
        return
      }
      if (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
      ) {
        setState((s) => ({
          ...s,
          isDragging: true,
          dragOffset: { x: x - rect.x, y: y - rect.y },
        }))
        return
      }
    }

    setState({
      rect: { x, y, width: 0, height: 0 },
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      resizeHandle: 'null',
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const bg = cropBackgroundRef.current
    if (!bg) return
    const rectBounds = bg.getBoundingClientRect()
    const x = e.clientX - rectBounds.left
    const y = e.clientY - rectBounds.top

    if (!rect) return

    // Update cursor
    const handle = getHandleUnderMouse(rect, x, y)
    bg.style.cursor = handle !== 'null' ? getCursorForHandle(handle) : 'move'

    setState((s) => {
      if (s.resizeHandle !== 'null' && s.rect) {
        const newRect = { ...s.rect }
        const maxW = bg.clientWidth
        const maxH = bg.clientHeight

        switch (s.resizeHandle) {
          case 'nw':
            newRect.x = Math.max(0, x)
            newRect.y = Math.max(0, y)
            newRect.width = s.rect.x + s.rect.width - newRect.x
            newRect.height = s.rect.y + s.rect.height - newRect.y
            break
          case 'n':
            newRect.y = Math.max(0, y)
            newRect.height = s.rect.y + s.rect.height - newRect.y
            break
          case 'ne':
            newRect.y = Math.max(0, y)
            newRect.width = Math.min(maxW - s.rect.x, x - s.rect.x)
            newRect.height = s.rect.y + s.rect.height - newRect.y
            break
          case 'e':
            newRect.width = Math.min(maxW - s.rect.x, x - s.rect.x)
            break
          case 'se':
            newRect.width = Math.min(maxW - s.rect.x, x - s.rect.x)
            newRect.height = Math.min(maxH - s.rect.y, y - s.rect.y)
            break
          case 's':
            newRect.height = Math.min(maxH - s.rect.y, y - s.rect.y)
            break
          case 'sw':
            newRect.x = Math.max(0, x)
            newRect.width = s.rect.x + s.rect.width - newRect.x
            newRect.height = Math.min(maxH - s.rect.y, y - s.rect.y)
            break
          case 'w':
            newRect.x = Math.max(0, x)
            newRect.width = s.rect.x + s.rect.width - newRect.x
            break
        }
        newRect.width = Math.max(1, newRect.width)
        newRect.height = Math.max(1, newRect.height)
        return { ...s, rect: newRect }
      }

      if (s.isDragging && s.rect) {
        let newX = x - s.dragOffset.x
        let newY = y - s.dragOffset.y
        newX = Math.max(0, Math.min(newX, bg.clientWidth - s.rect.width))
        newY = Math.max(0, Math.min(newY, bg.clientHeight - s.rect.height))
        return { ...s, rect: { ...s.rect, x: newX, y: newY } }
      }

      return s
    })
  }

  const handleMouseUp = () => {
    setState((s) => ({ ...s, isDragging: false, resizeHandle: 'null' }))
  }

  return (
    <div className="modal is-active">
      <div className="modal-background-faded"></div>
      <div className="ob-crop ob-border-radius">
        <div
          ref={cropContentRef}
          className="ob-crop__content"
          style={{ position: 'relative' }}
        >
          <div
            ref={cropBackgroundRef}
            className="ob-crop__background cypress-annotation-signature-pad"
            style={{ position: 'relative' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {rect && (
              <div
                style={{
                  position: 'absolute',
                  left: rect.x,
                  top: rect.y,
                  width: rect.width,
                  height: rect.height,
                  border: '2px dashed #00ff99',
                  boxSizing: 'border-box',
                  cursor: state.isDragging ? 'move' : 'default',
                }}
              >
                <GridOverlay width={rect.width} height={rect.height} />
              </div>
            )}
          </div>
        </div>
        <div className="ob-crop__buttons ob-crop__buttons-actions">
          <button
            type="button"
            className="button is-light ob-button ob-crop__button ob-crop__button-action cypress-annotation-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button is-primary ob-button ob-crop__button ob-crop__button-action cypress-annotation-save-button"
            disabled={!rect}
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

/** Renders a 3x3 rule-of-thirds overlay inside a rectangle */
function GridOverlay({ width, height }: { width: number; height: number }) {
  const thirdsW = width / 3
  const thirdsH = height / 3

  return (
    <>
      {/* Vertical lines */}
      <div
        style={{
          position: 'absolute',
          left: thirdsW,
          top: 0,
          width: 1,
          height: '100%',
          backgroundColor: 'rgba(0,255,153,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 2 * thirdsW,
          top: 0,
          width: 1,
          height: '100%',
          backgroundColor: 'rgba(0,255,153,0.5)',
        }}
      />
      {/* Horizontal lines */}
      <div
        style={{
          position: 'absolute',
          top: thirdsH,
          left: 0,
          height: 1,
          width: '100%',
          backgroundColor: 'rgba(0,255,153,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 2 * thirdsH,
          left: 0,
          height: 1,
          width: '100%',
          backgroundColor: 'rgba(0,255,153,0.5)',
        }}
      />
    </>
  )
}
