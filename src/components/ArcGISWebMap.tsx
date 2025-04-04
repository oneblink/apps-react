import * as React from 'react'
import { FormTypes, PointTypes } from '@oneblink/types'
import MapView from '@arcgis/core/views/MapView'
import WebMap from '@arcgis/core/WebMap'
// import Home from '@arcgis/core/widgets/Home'
// import Search from '@arcgis/core/widgets/Search'
import Zoom from '@arcgis/core/widgets/Zoom'
import LayerList from '@arcgis/core/widgets/LayerList'
import Expand from '@arcgis/core/widgets/Expand'
import BaseMapGallery from '@arcgis/core/widgets/BasemapGallery'
// import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import Sketch from '@arcgis/core/widgets/Sketch'
import OnLoading from './renderer/OnLoading'
import MaterialIcon from './MaterialIcon'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import Layer from '@arcgis/core/layers/Layer'
import '../styles/arcgis-external.css'
import useIsPageVisible from '../hooks/useIsPageVisible'
import { FormElementValueChangeHandler } from '../types/form'
import { v4 as uuid } from 'uuid'
// import ArcGISCustomSketchWidget from './ArcGIS/CustomSketch'
import useFlattenElements from '../hooks/useFlattenElementsContext'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import BaseMap from '@arcgis/core/Basemap'
import { ArcgisElementWithLookupProps } from '../form-elements/FormElementArcGISWebMap'
import Color from '@arcgis/core/Color'
import { IconButton } from '@mui/material'

export type ArcGISElementValue =
  | {
      layers?: LayerConfig[]
      drawingLayer?: Graphic[]
      userInput?: Graphic[]
    }
  | undefined

type Props = {
  element: ArcgisElementWithLookupProps
  id: string
  value: ArcGISElementValue
  onChange: FormElementValueChangeHandler<ArcGISElementValue>
  'aria-describedby'?: string
}

export interface LayerConfig {
  title: string
  graphics: Graphic[]
}

// type SketchToolAttributes = {
//   label: string
//   color?: string
// }

const drawingLayer = new GraphicsLayer({ id: uuid() })
// demo form
// const ADDRESS_ELEMENT_ID = '10ab221a-340a-4874-aa33-37f03c9dc6b7'

// dev form
const ADDRESS_ELEMENT_ID = '4c512266-2410-475a-8fe8-aa67a0888499'

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
  sketch?: Sketch
  sketchToolType: 'point' | 'polygon'
}) {
  return (
    <div className="esri-widget">
      <header style={{ display: 'flex' }}>
        <b style={{ flexGrow: 1, padding: '0.5rem' }}>Select an option</b>
        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          data-cypress="copy-to-clip-board-button"
          // className={className}
          // sx={noMarginY ? noMargin : undefined}
          // {...rest}
        >
          <MaterialIcon fontSize="small">close</MaterialIcon>
        </IconButton>
      </header>
      <div style={{ maxHeight: '200px', overflowY: 'scroll' }}>
        {drawingOptions?.map(({ color, label }, i) => (
          <div
            key={i}
            className="ob-list__item is-clickable"
            style={{ alignItems: 'center' }}
            onClick={() => {
              onClose()
              if (sketch && color && sketchToolType === 'point') {
                sketch.viewModel.pointSymbol.color = new Color(color)
                // sketch.pointSymbol.color = new Color(color)
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

function FormElementArcGISWebMap({
  element,
  id,
  value,
  onChange,
  ...props
}: Props) {
  console.log('value: ', value)
  console.log('element: ', element)
  const [loadError, setLoadError] = React.useState<Error>()

  // refs
  const ref = React.useRef<HTMLDivElement | null>(null)
  const layerPanelRef = React.useRef<Expand | null>(null)
  const mapGalleryPanelRef = React.useRef<Expand | null>(null)
  const webMapRef = React.useRef<WebMap | null>(null)
  const webMapViewRef = React.useRef<MapView | null>(null)
  // const sketchToolRef = React.useRef<SketchViewModel | null>(null)
  const sketchToolWidgetRef = React.useRef<Sketch>()
  const sketchToolLabelRef = React.useRef<{
    label: string
    activeTool: 'polygon' | 'point'
  } | null>(null)
  const currentSelectedGraphicRef = React.useRef<Graphic['geometry']>()
  // state
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const isPageVisible = useIsPageVisible()
  const [overlayLayerIds, setOverlayLayerIds] = React.useState<string[]>()
  const [drawingLayerGraphics, setDrawingLayerGraphics] = React.useState<
    Graphic[]
  >([])
  const [activeDrawingOptionsPicker, setActiveDrawingOptionsPicker] =
    React.useState<'point' | 'polygon'>()

  /** Center on selected address from linked Point element */
  const { formSubmissionModel } = useFormSubmissionModel()
  const flattenedElements = useFlattenElements()
  const addressElement = React.useMemo(() => {
    if (!ADDRESS_ELEMENT_ID) return
    return flattenedElements.find(
      (element) => element.id === ADDRESS_ELEMENT_ID && 'name' in element,
    ) as FormTypes.FormElementWithName
  }, [flattenedElements])

  const addressElementValue = React.useMemo(() => {
    if (!addressElement) return
    return formSubmissionModel[addressElement.name]
  }, [addressElement, formSubmissionModel])

  React.useEffect(() => {
    if (!addressElementValue) return
    const addr = addressElementValue as PointTypes.PointAddress
    if (webMapViewRef.current && addr.geo?.geometry?.coordinates) {
      // @ts-expect-error blah
      webMapViewRef.current.center = [
        addr.geo.geometry.coordinates[0],
        addr.geo.geometry.coordinates[1],
      ]
      webMapViewRef.current.zoom = 14
    }
  }, [addressElementValue])

  // if the drawing layer updates, update the element value
  React.useEffect(() => {
    if (!drawingLayerGraphics.length) return
    const graphics = drawingLayer.graphics
      .toArray()
      .map((graphic) => graphic.toJSON())
    onChange(element, {
      value: {
        ...(value ?? {}),
        drawingLayer: graphics,
        userInput: graphics,
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingLayerGraphics])

  const onValueChange = React.useCallback(
    (value: ArcGISElementValue) => {
      if (!value || !webMapViewRef.current) return
      // remove any overlay layers we've added previously
      if (overlayLayerIds) {
        const layersToRemove = overlayLayerIds.reduce(
          (toRemove: Layer[], id) => {
            const layer = webMapRef.current?.layers.find(
              (layer) => layer.id === id,
            )
            if (layer) toRemove.push(layer)
            return toRemove
          },
          [],
        )
        webMapRef.current?.layers.removeMany(layersToRemove)
      }

      if (value.layers) {
        const newOverlayLayerIds = []
        for (const layer of value.layers) {
          const overlayLayer = new GraphicsLayer()

          layer.graphics.forEach((g) => {
            const graphic = Graphic.fromJSON(g)
            overlayLayer.add(graphic)
          })

          overlayLayer.title = layer.title as string
          newOverlayLayerIds.push(overlayLayer.id)
          webMapRef.current?.layers.add(overlayLayer)
        }
        setOverlayLayerIds(newOverlayLayerIds)
      } else {
        setOverlayLayerIds([])
      }

      if (value.drawingLayer) {
        webMapRef.current?.layers.remove(drawingLayer)
        drawingLayer.removeAll()
        drawingLayer.addMany(value.drawingLayer.map((g) => Graphic.fromJSON(g)))
        webMapRef.current?.layers.add(drawingLayer)
      }
    },
    [overlayLayerIds],
  )

  const startSketch = React.useCallback(
    (sketchToolType: 'point' | 'polygon', setLabel?: string) => {
      if (setLabel) {
        console.log('setting ref label')
        sketchToolLabelRef.current = {
          label: setLabel,
          activeTool: sketchToolType,
        }
      }
      console.log('sketchToolWidgetRef.current: ', sketchToolWidgetRef.current)
      console.log('creating: ', sketchToolType)
      sketchToolWidgetRef.current?.create(sketchToolType)
    },
    [sketchToolLabelRef],
  )

  // the below is to handle prefill
  // TODO: move drawn graphics from drawing layer to an "overlay" layer in here too
  React.useEffect(() => {
    onValueChange(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  React.useEffect(() => {
    let view: MapView
    const loadMap = async () => {
      try {
        // webMapRef.current = new WebMap({
        //   portalItem: {
        //     id: element.webMapId,
        //   },
        // })
        webMapRef.current = new WebMap()
        await webMapRef.current.load()
        drawingLayer.title = 'Drawing'
        webMapRef.current.add(drawingLayer)

        view = new MapView({
          map: webMapRef.current,
          container: ref.current || undefined,
        })
        // remove default widgets
        const components = view.ui.getComponents()
        for (const component of components) {
          view.ui.remove(component)
        }

        // view.ui.add(
        //   new Search({
        //     view,
        //   }),
        //   'top-left',
        // )
        // view.ui.add(
        //   new Home({
        //     view,
        //   }),
        //   'top-left',
        // )
        view.ui.add(
          new Zoom({
            view,
          }),
          'bottom-left',
        )

        const sketch = new Sketch({
          view,
          layer: drawingLayer,
          creationMode: 'single',
          layout: 'vertical',
          availableCreateTools: ['point', 'polygon'],
          visibleElements: {
            duplicateButton: false,
            settingsMenu: false,
            undoRedoMenu: false,
            selectionTools: {
              'lasso-selection': false,
              'rectangle-selection': false,
            },
          },
        })

        // default sketch colors
        sketch.viewModel.polygonSymbol.color = new Color([46, 82, 193, 0.05])
        if ('outline' in sketch.viewModel.polygonSymbol) {
          sketch.viewModel.polygonSymbol.outline.color = new Color([
            225, 225, 225, 1,
          ])
        }
        sketch.viewModel.pointSymbol.color = new Color([46, 82, 193, 0.05])
        if ('outline' in sketch.viewModel.pointSymbol) {
          sketch.viewModel.pointSymbol.outline.color = new Color([
            [0, 30, 100, 1],
          ])
        }

        sketch.on('update', (event) => {
          if (event.state === 'complete') {
            const updatedGeometry = JSON.stringify(
              event.graphics[0].geometry.toJSON(),
            )
            if (
              updatedGeometry ===
              JSON.stringify(currentSelectedGraphicRef.current?.toJSON())
            ) {
              console.log('no updates made')
            } else {
              const gfx = drawingLayer.graphics.toArray()
              setDrawingLayerGraphics(gfx)
            }
            currentSelectedGraphicRef.current = undefined
          }
          if (event.state === 'start') {
            // because selecting and deselecting a graphic triggers an update
            // we need to keep track of the graphic geometry being updated
            // so we can compare when the update "completes"
            currentSelectedGraphicRef.current =
              event.graphics[0].geometry.clone()
          }
        })
        sketch.on('create', (event) => {
          if (event.state === 'cancel') {
            console.log('create cancelled, clearing label')
            sketchToolLabelRef.current = null
          }
          if (event.state === 'complete') {
            event.graphic.attributes = {
              geometryType: event.tool,
              id: uuid(),
              active: true,
            }
            if (sketchToolLabelRef.current) {
              event.graphic.attributes.name = sketchToolLabelRef.current.label
              sketchToolLabelRef.current = null
            }
            const gfx = drawingLayer.graphics.toArray()
            setDrawingLayerGraphics(gfx)
          }
        })

        // sketchToolRef.current = sketch
        // view.ui.add('OneBlinkCustomSketchTool', 'bottom-right')
        sketch.viewModel.watch('activeTool', () => {
          if (
            sketch.activeTool === 'polygon' &&
            element.polygonDrawingOptions &&
            (!sketchToolLabelRef.current ||
              sketchToolLabelRef.current?.activeTool !== 'polygon')
          ) {
            sketch.cancel()
            setActiveDrawingOptionsPicker('polygon')
          } else if (
            sketch.activeTool === 'point' &&
            element.pointDrawingOptions &&
            (!sketchToolLabelRef.current ||
              sketchToolLabelRef.current?.activeTool !== 'point')
          ) {
            sketch.cancel()
            setActiveDrawingOptionsPicker('point')
          }
        })
        sketchToolWidgetRef.current = sketch
        view.ui.add(sketch, 'bottom-right')
        view.ui.add('OneBlinkDrawingOptionsSelector', 'bottom-right')

        const layerList = new LayerList({
          view,
        })

        layerPanelRef.current = new Expand({
          expandIcon: 'layers',
          view,
          content: layerList,
          expanded: element.showLayerPanel,
          mode: 'floating',
          visible: false,
        })

        view.ui.add(layerPanelRef.current, 'top-right')

        const baseMapGallery = new BaseMapGallery({
          view,
          activeBasemap: BaseMap.fromId('hybrid'),
        })

        mapGalleryPanelRef.current = new Expand({
          expandIcon: 'basemap',
          view,
          content: baseMapGallery,
          mode: 'floating',
          visible: false,
        })
        view.ui.add(mapGalleryPanelRef.current, 'top-right')
        view.on('click', function (event) {
          view.hitTest(event).then(function (response) {
            const graphics = response.results.filter(
              (result) => result.type === 'graphic',
            )
            const graphic = graphics.find((g) => !!g.graphic.attributes.name)

            // const point = new Point()
            // point.x = response.screenPoint.x
            // point.y = response.screenPoint.y
            if (graphic) {
              view.popup.open({
                title: graphic.graphic.attributes.name,
                location:
                  graphic.graphic.geometry.type === 'polygon'
                    ? graphic.graphic.geometry.extent.center
                    : graphic.graphic.geometry,
              })
            }
          })
        })

        // once the view has loaded
        view.when(() => {
          setIsLoading(false)
          webMapViewRef.current = view
          const addr = addressElementValue as PointTypes.PointAddress
          if (addr.geo?.geometry?.coordinates) {
            // @ts-expect-error blah
            view.center = [
              addr.geo.geometry.coordinates[0],
              addr.geo.geometry.coordinates[1],
            ]
            view.zoom = 14
          }

          if (value) {
            try {
              onValueChange(value)
            } catch (e) {
              console.log('error setting value in initialise call: ', e)
            }
          }
        })
      } catch (e) {
        console.warn('Error while trying to load arcgis web map ', e)
        setLoadError(e as Error)
        setIsLoading(false)
      }
    }

    if (!webMapViewRef.current) {
      loadMap()
    } else {
      console.log('mapviewref is defined, not reloading')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element])

  React.useEffect(() => {
    if (!isLoading) {
      if (isPageVisible) {
        if (layerPanelRef.current) {
          layerPanelRef.current.visible = true
        }
        if (mapGalleryPanelRef.current) {
          mapGalleryPanelRef.current.visible = true
        }
      } else {
        if (layerPanelRef.current) {
          layerPanelRef.current.visible = false
        }
        if (mapGalleryPanelRef.current) {
          mapGalleryPanelRef.current.visible = false
        }
      }
    }
  }, [isPageVisible, isLoading])

  if (loadError) {
    return (
      <figure className="ob-figure">
        <div className="figure-content has-text-centered">
          <MaterialIcon className="icon-large has-margin-bottom-6 has-text-warning">
            error
          </MaterialIcon>
          <h4 className="title is-4">We were unable to display your web map</h4>
          <p>{loadError.message}</p>
        </div>
      </figure>
    )
  }

  return (
    <>
      {isLoading && <OnLoading />}
      <div
        className="arcgis-web-map"
        ref={ref}
        id={id}
        aria-describedby={props['aria-describedby']}
      />
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
            sketch={sketchToolWidgetRef.current}
            startSketch={startSketch}
            isOpen={!!activeDrawingOptionsPicker}
            onClose={() => setActiveDrawingOptionsPicker(undefined)}
            sketchToolType={activeDrawingOptionsPicker}
          />
        )}
      </div>
      {/* <ArcGISCustomSketchWidget
        sketch={sketchToolRef.current}
        setSketchToolLabel={(val) => (sketchToolLabelRef.current = val || null)}
        element={element}
      /> */}
    </>
  )
}

export default React.memo(FormElementArcGISWebMap)
