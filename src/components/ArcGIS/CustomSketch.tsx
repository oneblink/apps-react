import * as React from 'react'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import MaterialIcon from '../MaterialIcon'
import Color from '@arcgis/core/Color'
import { ArcgisElementWithLookupProps } from '../../form-elements/FormElementArcGISWebMap'

function DrawingOptionsList({
  drawingOptions,
  sketch,
  startSketch,
  onClose,
  sketchToolType,
}: {
  drawingOptions: { label: string; color?: string }[]
  startSketch: (sketchToolType: 'point' | 'polygon', setLabel?: string) => void
  onClose: () => void
  isOpen: boolean
  sketch: SketchViewModel | null
  sketchToolType: 'point' | 'polygon'
}) {
  return (
    <div className="esri-widget">
      <header style={{ display: 'flex' }}>
        <b style={{ flexGrow: 1, padding: '0.5rem' }}>Select an option</b>
        <button type="button" onClick={() => onClose()}>
          <i className="material-icons text-light40">close</i>
        </button>
      </header>
      <div style={{ maxHeight: '200px', overflowY: 'scroll' }}>
        {drawingOptions?.map(({ color, label }, i) => (
          <div
            key={i}
            className="ob-list__item is-clickable"
            onClick={() => {
              onClose()
              if (sketch && color && sketchToolType === 'point') {
                sketch.pointSymbol.color = new Color(color)
              }
              startSketch(sketchToolType, label)
            }}
          >
            <MaterialIcon sx={{ color: `${color} !important` }}>
              location_on
            </MaterialIcon>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ArcGISCustomSketchWidget({
  sketch,
  setSketchToolLabel,
  element,
}: {
  sketch: SketchViewModel | null
  setSketchToolLabel: (val: string | undefined) => void
  element: ArcgisElementWithLookupProps
}) {
  const [activeDrawingOptionsPicker, setActiveDrawingOptionsPicker] =
    React.useState<'point' | 'polygon'>()

  const startSketch = React.useCallback(
    (sketchToolType: 'point' | 'polygon', setLabel?: string) => {
      if (setLabel) {
        setSketchToolLabel(setLabel)
      }
      sketch?.create(sketchToolType)
    },
    [setSketchToolLabel, sketch],
  )

  console.log('element in sketch tool: ', element)
  console.log('activeDrawingOptionsPicker: ', activeDrawingOptionsPicker)
  return (
    <>
      <div id="OneBlinkCustomSketchTool" className="oneblink-arcgis-sketch">
        <div className="esri-widget widget">
          <button
            type="button"
            className="sketch-button"
            onClick={() => sketch?.cancel()}
          >
            <MaterialIcon className="has-text-grey">north_west</MaterialIcon>
          </button>
          <button
            type="button"
            className="sketch-button"
            onClick={() => {
              if (element.polygonDrawingOptions) {
                setActiveDrawingOptionsPicker('point')
              } else startSketch('point')
            }}
          >
            <MaterialIcon className="has-text-grey">location_on</MaterialIcon>
          </button>
          <button
            type="button"
            className="sketch-button"
            onClick={() => {
              if (element.pointDrawingOptions) {
                setActiveDrawingOptionsPicker('polygon')
              } else startSketch('polygon')
            }}
          >
            <MaterialIcon className="has-text-grey">
              pentagon-outlined
            </MaterialIcon>
          </button>
        </div>
      </div>
      <div
        id="OneBlinkDrawingOptionsSelector"
        className="oneblink-arcgis-sketch"
      >
        {activeDrawingOptionsPicker && (
          <DrawingOptionsList
            drawingOptions={
              (activeDrawingOptionsPicker === 'point'
                ? element.pointDrawingOptions
                : element.polygonDrawingOptions) || []
            }
            sketch={sketch}
            startSketch={startSketch}
            isOpen={!!activeDrawingOptionsPicker}
            onClose={() => setActiveDrawingOptionsPicker(undefined)}
            sketchToolType={activeDrawingOptionsPicker}
          />
        )}
      </div>
    </>
  )
}
