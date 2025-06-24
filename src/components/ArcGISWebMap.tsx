import * as React from 'react'
import { FormTypes } from '@oneblink/types'
import MapView from '@arcgis/core/views/MapView'
import WebMap from '@arcgis/core/WebMap'
import Home from '@arcgis/core/widgets/Home'
import Search from '@arcgis/core/widgets/Search'
import Zoom from '@arcgis/core/widgets/Zoom'
import LayerList from '@arcgis/core/widgets/LayerList'
import Expand from '@arcgis/core/widgets/Expand'
import BaseMapGallery from '@arcgis/core/widgets/BasemapGallery'
import Sketch from '@arcgis/core/widgets/Sketch'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import Layer from '@arcgis/core/layers/Layer'
import Popup from '@arcgis/core/widgets/Popup'
import { Point } from '@arcgis/core/geometry'
import { v4 as uuid } from 'uuid'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine'

import OnLoading from '../components/renderer/OnLoading'
import MaterialIcon from './MaterialIcon'

import useIsPageVisible from '../hooks/useIsPageVisible'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler } from '../types/form'
import '../styles/arcgis-external.css'
import { Box, Divider, IconButton } from '@mui/material'

type Props = {
  element: FormTypes.ArcGISWebMapElement
  id: string
  value: ArcGISWebMapElementValue | undefined
  onChange: FormElementValueChangeHandler<ArcGISWebMapElementValue>
  'aria-describedby'?: string
  setIsDirty: () => void
}

type SketchCreateTool = Parameters<Sketch['create']>[0]

function DrawingOptionsList({
  options,
  sketchTool,
  onClose,
  sketchToolType,
  setSelectedGraphicAttributes,
}: {
  options: { id: string; label: string; value: string; description?: string }[]
  onClose: () => void
  sketchTool: Sketch
  sketchToolType: SketchCreateTool
  setSelectedGraphicAttributes: (opt: {
    label: string
    value: string
    description?: string
  }) => void
}) {
  return (
    <div className="esri-widget">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <b style={{ padding: '0.5rem' }}>Select an option</b>
        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          size="small"
          data-cypress="copy-to-clip-board-button"
        >
          <MaterialIcon fontSize="small">close</MaterialIcon>
        </IconButton>
      </Box>
      <Divider sx={{ backgroundColor: 'unset', margin: '0px 8px' }} />
      <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
        {options?.map(({ id, value, label, description }) => (
          <div
            key={id}
            className="ob-list__item is-clickable"
            style={{ alignItems: 'center' }}
            onClick={() => {
              onClose()
              sketchTool?.create(sketchToolType)
              setSelectedGraphicAttributes({ value, label, description })
            }}
          >
            {label}
          </div>
        ))}
      </Box>
    </div>
  )
}

function FormElementArcGISWebMap({
  element,
  id,
  value,
  onChange,
  setIsDirty,
  ...props
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const layerPanelRef = React.useRef<Expand>()
  const mapGalleryPanelRef = React.useRef<Expand>()
  const sketchToolRef = React.useRef<Sketch>()
  const drawingLayerRef = React.useRef<GraphicsLayer>()
  const selectedGraphicForUpdate = React.useRef<string>()
  const mapViewRef = React.useRef<MapView>()
  const measurementLayerRef = React.useRef<GraphicsLayer>()

  const [overlayLayerIds, setOverlayLayerIds] = React.useState<string[]>()
  const [loadError, setLoadError] = React.useState<Error>()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const isPageVisible = useIsPageVisible()
  const [selectedGraphicAttributes, setSelectedGraphicAttributes] =
    React.useState<{
      value: string
      label: string
      description?: string
    }>()
  // only used when an allowed drawing tool also has a list of graphic attribute options to display to the user
  const [activeSketchToolMenu, setActiveSketchToolMenu] =
    React.useState<SketchCreateTool>()

  const updateDrawingInputSubmissionValue = React.useCallback(() => {
    const updatedGraphics = drawingLayerRef.current?.graphics
      .toArray()
      .map((graphic) => graphic.toJSON())

    onChange(element, {
      value: {
        ...(value || {}),
        drawingLayer: updatedGraphics,
        userInput: updatedGraphics,
      },
    })

    setIsDirty()
  }, [element, onChange, setIsDirty, value])

  const updateMapViewSubmissionValue = React.useCallback(() => {
    const zoom = mapViewRef.current?.zoom
    const latitude = mapViewRef.current?.center.latitude
    const longitude = mapViewRef.current?.center.longitude
    if (zoom && latitude && longitude) {
      onChange(element, {
        value: {
          ...(value || {}),
          view: {
            zoom,
            latitude,
            longitude,
          },
        },
      })
    }
  }, [element, onChange, value])

  // Helper to add measurement labels for a graphic
  const addMeasurementLabels = React.useCallback((graphic: __esri.Graphic) => {
    const measurementLayer = measurementLayerRef.current
    if (!measurementLayer) return
    measurementLayer.removeAll()
    const geom = graphic.geometry
    if (!geom) return
    const view = mapViewRef.current
    // Only for polyline or polygon
    const offsetPixels = 20 // pixels above the line
    function getOffsetPoint(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      spatialReference: __esri.SpatialReference,
    ) {
      // Midpoint in map coordinates
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      if (view) {
        // Convert midpoint to screen coordinates
        const screenPt = view.toScreen(
          new Point({ x: midX, y: midY, spatialReference }),
        )
        if (screenPt) {
          // Offset upward in screen space
          const offsetScreenPt = { x: screenPt.x, y: screenPt.y - offsetPixels }
          // Convert back to map coordinates
          const mapPt = view.toMap(offsetScreenPt)
          if (mapPt) return mapPt
        }
      }
      // Fallback: offset in map units (may not be visually above)
      // Calculate the normal vector (perpendicular to the segment)
      const dx = x2 - x1
      const dy = y2 - y1
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length === 0) return new Point({ x: midX, y: midY, spatialReference })
      const nx = -dy / length
      const ny = dx / length
      const offsetDistance = 20 // meters (or map units)
      return new Point({
        x: midX + nx * offsetDistance,
        y: midY + ny * offsetDistance,
        spatialReference,
      })
    }
    if (geom.type === 'polyline') {
      const polyline = geom as __esri.Polyline
      polyline.paths.forEach((path) => {
        for (let i = 0; i < path.length - 1; i++) {
          const [x1, y1] = path[i]
          const [x2, y2] = path[i + 1]
          const segment = {
            type: 'polyline',
            paths: [
              [
                [x1, y1],
                [x2, y2],
              ],
            ],
            spatialReference: polyline.spatialReference,
          } as __esri.Polyline
          const length = geometryEngine.geodesicLength(segment, 'meters')
          const labelPt = getOffsetPoint(
            x1,
            y1,
            x2,
            y2,
            polyline.spatialReference,
          )
          const label = new Graphic({
            geometry: labelPt,
            symbol: new TextSymbol({
              text: `${Math.round(length)}m`,
              color: 'white',
              haloColor: 'black',
              haloSize: '1px',
              font: { size: 12, weight: 'bold' },
            }),
          })
          measurementLayer.add(label)
        }
      })
    } else if (geom.type === 'polygon') {
      const polygon = geom as __esri.Polygon
      polygon.rings.forEach((ring) => {
        for (let i = 0; i < ring.length - 1; i++) {
          const [x1, y1] = ring[i]
          const [x2, y2] = ring[i + 1]
          const segment = {
            type: 'polyline',
            paths: [
              [
                [x1, y1],
                [x2, y2],
              ],
            ],
            spatialReference: polygon.spatialReference,
          } as __esri.Polyline
          const length = geometryEngine.geodesicLength(segment, 'meters')
          const labelPt = getOffsetPoint(
            x1,
            y1,
            x2,
            y2,
            polygon.spatialReference,
          )
          const label = new Graphic({
            geometry: labelPt,
            symbol: new TextSymbol({
              text: `${Math.round(length)}m`,
              color: 'white',
              haloColor: 'black',
              haloSize: '1px',
              font: { size: 12, weight: 'bold' },
            }),
          })
          measurementLayer.add(label)
        }
      })
    }
  }, [])

  React.useEffect(() => {
    if (element.readOnly) return
    // event listeners for drawing tool creates/updates/deletes
    // these need to be removed and recreated when the submission value changes
    // to ensure they always have access to the latest submission value
    const createListener = sketchToolRef.current?.on(
      'create',
      (sketchEvent) => {
        // Live update while drawing
        if (sketchEvent.state === 'active' && sketchEvent.graphic) {
          addMeasurementLabels(sketchEvent.graphic)
        }
        if (sketchEvent.state === 'complete') {
          if (selectedGraphicAttributes) {
            sketchEvent.graphic.attributes = {
              name: selectedGraphicAttributes.value,
              label: selectedGraphicAttributes.label,
              description: selectedGraphicAttributes.description,
            }
            setSelectedGraphicAttributes(undefined)
          }
          updateDrawingInputSubmissionValue()
          addMeasurementLabels(sketchEvent.graphic)
        }
        if (sketchEvent.state === 'cancel') {
          setSelectedGraphicAttributes(undefined)
          if (measurementLayerRef.current)
            measurementLayerRef.current.removeAll()
        }
      },
    )

    const updateListener = sketchToolRef.current?.on(
      'update',
      (sketchEvent) => {
        if (sketchEvent.state === 'complete') {
          // only update the submission value if the graphic's geometry was actually changed
          if (
            JSON.stringify(sketchEvent.graphics[0].geometry.toJSON()) !==
            selectedGraphicForUpdate.current
          ) {
            updateDrawingInputSubmissionValue()
          }
          addMeasurementLabels(sketchEvent.graphics[0])
          selectedGraphicForUpdate.current = undefined
        }
        if (sketchEvent.state === 'start') {
          selectedGraphicForUpdate.current = JSON.stringify(
            sketchEvent.graphics[0].geometry.clone().toJSON(),
          )
        }
      },
    )

    const deleteListener = sketchToolRef.current?.on('delete', () => {
      mapViewRef.current?.closePopup()
      updateDrawingInputSubmissionValue()
      if (measurementLayerRef.current) measurementLayerRef.current.removeAll()
    })

    const mapViewChangeListener = mapViewRef.current?.watch(
      'stationary',
      () => {
        const mapView = mapViewRef.current
        if (mapView && mapView.stationary) {
          const hasViewChanged =
            mapView.zoom !== value?.view?.zoom ||
            mapView.center.longitude !== value?.view?.longitude ||
            mapView.center.latitude !== value?.view?.latitude
          if (hasViewChanged) {
            updateMapViewSubmissionValue()
          }
        }
      },
    )

    const sketchToolListener = sketchToolRef.current?.viewModel.watch(
      'activeTool',
      () => {
        if (selectedGraphicAttributes) {
          return
        }
        const activeTool = sketchToolRef.current?.activeTool
        const hasGraphicAttributeOptions = !!element.allowedDrawingTools?.find(
          (tool) => tool.type === activeTool,
        )?.graphicAttributeOptions?.length

        if (activeTool) {
          if (
            hasGraphicAttributeOptions &&
            (activeTool === 'point' ||
              activeTool === 'polygon' ||
              activeTool === 'circle' ||
              activeTool === 'rectangle' ||
              activeTool === 'polyline')
          ) {
            // the sketch.create() fn only allows active tools of the above 5 types
            // hence we must check above to keep the types happy further down the line
            sketchToolRef.current?.cancel()
            setActiveSketchToolMenu(activeTool)
          } else {
            setActiveSketchToolMenu(undefined)
          }
        }
      },
    )

    mapViewRef.current?.on('click', (event) => {
      mapViewRef.current?.hitTest(event).then((response) => {
        // the "hit test" will typically yield the graphic we want to display the popup for,
        // and an ArcGIS built-in graphic which highlights the selected graphic.
        // By filtering for the graphic with the "label" attribute, we're able to reliably
        // get the graphic we want to display the popup for.
        const result = response.results
          .filter((r) => r.type === 'graphic')
          .find((r) => !!r.graphic.attributes.label)

        if (result) {
          mapViewRef.current?.openPopup({
            title: result.graphic.attributes.label,
            content: result.graphic.attributes.description,
          })
        }
      })
    })

    return () => {
      createListener?.remove()
      updateListener?.remove()
      deleteListener?.remove()
      mapViewChangeListener?.remove()
      sketchToolListener?.remove()
    }
  }, [
    isLoading,
    value,
    updateDrawingInputSubmissionValue,
    updateMapViewSubmissionValue,
    element,
    selectedGraphicAttributes,
    addMeasurementLabels,
  ])

  const onSubmissionValueChange = React.useCallback(() => {
    const view = mapViewRef.current
    const map = mapViewRef.current?.map
    if (!view || !map) return

    const newLayerIds = value?.layers?.map((l) => l.id)
    // remove map layers no longer in submission value
    if (overlayLayerIds) {
      const layersToRemove = overlayLayerIds.reduce((toRemove: Layer[], id) => {
        if (!newLayerIds?.includes(id)) {
          const layer = map.layers.find((layer) => layer.id === id)
          if (layer) toRemove.push(layer)
        }
        return toRemove
      }, [])
      map.layers.removeMany(layersToRemove)
    }

    if (value?.layers) {
      // determine if a layer is new or existing and handle accordingly
      for (const layer of value.layers) {
        const existingLayer = map.layers.find(
          (mapLayer) => mapLayer.id === layer.id,
        )
        if (!existingLayer) {
          const newLayer = new GraphicsLayer({
            title: layer.title as string,
            id: layer.id,
          })
          newLayer.addMany(layer.graphics.map((g) => Graphic.fromJSON(g)))
          map.layers.add(newLayer)
        } else if (existingLayer && existingLayer.type === 'graphics') {
          const existingGraphicLayer = existingLayer as GraphicsLayer
          existingGraphicLayer.title = layer.title
          existingGraphicLayer.graphics.removeAll()
          existingGraphicLayer.addMany(
            layer.graphics.map((g) => Graphic.fromJSON(g)),
          )
        }
      }
    }

    // finally, set the new layer ids in state
    setOverlayLayerIds(newLayerIds)

    // update the web map's drawing layers
    const drawingLayer = drawingLayerRef.current
    if (value?.drawingLayer && drawingLayer) {
      map.layers.remove(drawingLayer)
      drawingLayer.removeAll()
      drawingLayer.addMany(value.drawingLayer.map((g) => Graphic.fromJSON(g)))
      map.layers.add(drawingLayer)
    }
    if (value?.view) {
      view.zoom = value.view.zoom
      view.center = new Point({
        latitude: value.view.latitude,
        longitude: value.view.longitude,
      })
    }
  }, [overlayLayerIds, value])

  React.useEffect(() => {
    if (!isLoading && mapViewRef.current) {
      onSubmissionValueChange()
    }
    // only run the above when the submission value changes or the map finishes loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isLoading])

  const drawingOptionsContainerId = `OneBlinkDrawingOptionsSelector-${element.id}`

  React.useEffect(() => {
    const loadMap = async () => {
      try {
        const map = new WebMap({
          portalItem: {
            id: element.webMapId,
          },
          basemap: element.basemapId || 'streets',
        })
        await map.load()

        const view = new MapView({
          map: map,
          container: ref.current || undefined,
          popup: new Popup({
            dockEnabled: true,
            dockOptions: {
              buttonEnabled: false,
              breakpoint: false,
              position: 'bottom-left',
            },
          }),
        })

        // remove default widgets
        const components = view.ui.getComponents()
        for (const component of components) {
          view.ui.remove(component)
        }

        if (element.addressSearchWidgetEnabled) {
          view.ui.add(
            new Search({
              view,
            }),
            'top-left',
          )
        }

        if (element.homeWidgetEnabled) {
          view.ui.add(
            new Home({
              view,
            }),
            'top-left',
          )
        }

        view.ui.add(
          new Zoom({
            view,
          }),
          'bottom-right',
        )

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

        const baseMapGallery = new BaseMapGallery({ view })

        mapGalleryPanelRef.current = new Expand({
          expandIcon: 'basemap',
          view,
          content: baseMapGallery,
          mode: 'floating',
          visible: false,
        })

        view.ui.add(mapGalleryPanelRef.current, 'top-left')

        const drawingLayer = new GraphicsLayer({
          id: uuid(),
          title: 'Drawing',
        })
        drawingLayerRef.current = drawingLayer
        map.layers.add(drawingLayer)

        // Add measurement layer above drawing layer
        const measurementLayer = new GraphicsLayer({
          id: uuid(),
          title: 'Measurements',
        })
        measurementLayerRef.current = measurementLayer
        map.layers.add(measurementLayer)

        if (!element.readOnly && element.allowedDrawingTools?.length) {
          const sketch = new Sketch({
            view,
            layer: drawingLayer,
            creationMode: 'single',
            layout: 'vertical',
            availableCreateTools: [
              'point',
              'polyline',
              'polygon',
              'rectangle',
              'circle',
            ].filter((createTool) =>
              element.allowedDrawingTools?.find(
                (tool) => tool.type === createTool,
              ),
            ),
            // hiding the below by default
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
          sketchToolRef.current = sketch
          view.ui.add(sketch, 'bottom-right')
          view.ui.add(drawingOptionsContainerId, 'bottom-right')
        }

        // once the view has loaded
        view.when(() => {
          mapViewRef.current = view
          setIsLoading(false)
        })
      } catch (e) {
        console.warn('Error while trying to load arcgis web map ', e)
        setLoadError(e as Error)
        setIsLoading(false)
      }
    }

    if (!mapViewRef.current && !isLoading) {
      setIsLoading(true)
      loadMap()
    }
  }, [drawingOptionsContainerId, element, isLoading, value])

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
      <div id={drawingOptionsContainerId}>
        {!!activeSketchToolMenu && sketchToolRef.current && (
          <DrawingOptionsList
            options={
              element.allowedDrawingTools?.find(
                (tool) => tool.type === activeSketchToolMenu,
              )?.graphicAttributeOptions || []
            }
            onClose={() => setActiveSketchToolMenu(undefined)}
            setSelectedGraphicAttributes={(opt) => {
              setSelectedGraphicAttributes(opt)
            }}
            sketchToolType={activeSketchToolMenu}
            sketchTool={sketchToolRef.current}
          />
        )}
      </div>
    </>
  )
}

export default React.memo(FormElementArcGISWebMap)
