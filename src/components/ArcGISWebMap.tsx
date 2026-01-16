import * as React from 'react'
import { ArcGISTypes, FormTypes } from '@oneblink/types'
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
import Popup from '@arcgis/core/widgets/Popup'
import {
  Point,
  Polygon,
  SpatialReference,
  Polyline,
} from '@arcgis/core/geometry'
import TextSymbol from '@arcgis/core/symbols/TextSymbol'
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine'
import { Box, Divider, IconButton } from '@mui/material'
import throttle from 'lodash.throttle'
import { localisationService } from '../apps'
import { v4 as uuid } from 'uuid'

import OnLoading from '../components/renderer/OnLoading'
import MaterialIcon from './MaterialIcon'

import useIsPageVisible from '../hooks/useIsPageVisible'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler } from '../types/form'
import '../styles/arcgis-external.css'
import Layer from '@arcgis/core/layers/Layer'

type Props = {
  element: FormTypes.ArcGISWebMapElement
  id: string
  value: ArcGISWebMapElementValue | undefined
  onChange: FormElementValueChangeHandler<ArcGISWebMapElementValue>
  automatedSnapshotFileName: string
  'aria-describedby'?: string
  takeScreenShotRef: React.RefObject<
    | ((view?: ArcGISTypes.ArcGISWebMapElementValue['view']) => Promise<{
        dataUrl: string
      }>)
    | null
  >
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
  sketchTool: React.RefObject<Sketch | null>
  sketchToolType: SketchCreateTool
  setSelectedGraphicAttributes: (opt: {
    label: string
    value: string
    description?: string
  }) => void
}) {
  if (!sketchTool.current) return null
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
              sketchTool?.current?.create(sketchToolType)
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
  takeScreenShotRef,
  automatedSnapshotFileName,
  ...props
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const layerPanelRef = React.useRef<Expand>(null)
  const mapGalleryPanelRef = React.useRef<Expand>(null)
  const sketchToolRef = React.useRef<Sketch>(null)
  const drawingLayerRef = React.useRef<GraphicsLayer>(null)
  const selectedGraphicForUpdate = React.useRef<string | undefined>(undefined)
  const mapViewRef = React.useRef<MapView>(null)
  const measurementLayerRef = React.useRef<GraphicsLayer>(null)
  const defaultLayersRef = React.useRef<Layer[]>(null)

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
      value: (existingValue) => ({
        ...(existingValue || {}),
        drawingLayer: updatedGraphics,
        userInput: updatedGraphics,
        // Remove automated snapshot images when drawing again
        snapshotImages: existingValue?.snapshotImages?.filter(
          (snapshotImage) =>
            snapshotImage.fileName !== automatedSnapshotFileName,
        ),
      }),
    })
  }, [automatedSnapshotFileName, element, onChange])

  const updateMapViewSubmissionValue = React.useCallback(() => {
    const zoom = mapViewRef.current?.zoom
    const latitude = mapViewRef.current?.center.latitude
    const longitude = mapViewRef.current?.center.longitude
    if (zoom && latitude && longitude) {
      onChange(element, {
        value: (existingValue) => ({
          ...(existingValue || {}),
          view: {
            zoom,
            latitude,
            longitude,
          },
        }),
      })
    }
  }, [element, onChange])

  const getGeometryPoints = (
    geom: __esri.Geometry,
    spatialRef: SpatialReference,
  ) => {
    if (geom.type === 'polygon') {
      const polygon = geom as Polygon
      return polygon.rings[0].map(
        (ring) =>
          new Point({
            x: ring[0],
            y: ring[1],
            spatialReference: spatialRef,
          }),
      )
    } else if (geom.type === 'polyline') {
      const polyline = geom as Polyline
      return polyline.paths[0].map(
        (path) =>
          new Point({
            x: path[0],
            y: path[1],
            spatialReference: spatialRef,
          }),
      )
    }
  }

  const addMeasurementLabels = React.useCallback(
    (graphics: __esri.Graphic[]) => {
      if (!element.measurementDimensionsEnabled) return
      const spatialRef = new SpatialReference({ wkid: 3857 })
      const measurementLayer = measurementLayerRef.current
      const mapView = mapViewRef.current
      if (!measurementLayer || !mapView) return
      measurementLayer.removeAll()

      for (const graphic of graphics) {
        const geom = graphic.geometry
        if (!geom || (geom.type !== 'polygon' && geom.type !== 'polyline'))
          continue

        const points = getGeometryPoints(geom, spatialRef)
        if (!points) continue

        const { distanceUnit, distanceUnitShortName } =
          localisationService.getDistanceUnits()
        if (distanceUnit !== 'meters' && distanceUnit !== 'feet') {
          console.warn(
            'Unsupported distance unit provided in tenant configuration: ',
            distanceUnit,
          )
          return
        }
        const graphics: Graphic[] = []

        for (let i = 1; i < points.length; i++) {
          const x1 = points[i].x
          const x2 = points[i - 1].x
          const y1 = points[i].y
          const y2 = points[i - 1].y

          const midpoint = new Point({
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            spatialReference: spatialRef,
          })

          // Angle of the measurement label - this will be rotated to be parallel with the polygon or polyline edge
          const dx = x2 - x1
          const dy = y2 - y1
          const radians = Math.atan2(dy, dx)
          let angle = radians * (-180 / Math.PI)
          if (angle > 90 || angle < -90) {
            angle += 180
          }

          // offset of the measurement label against the edge of the polygon/polyline it's measuring
          const pixelOffset = 10
          const normalAngle = radians + Math.PI / 2
          const offsetScreenX = pixelOffset * Math.cos(normalAngle)
          const offsetScreenY = pixelOffset * Math.sin(normalAngle)

          const screenPoint = mapView.toScreen(midpoint)
          screenPoint.x += offsetScreenX
          screenPoint.y -= offsetScreenY
          const offsetMapPoint = mapView.toMap(screenPoint)

          const polyline = new Polyline({
            paths: [
              [
                [points[i].longitude, points[i].latitude],
                [points[i - 1].longitude, points[i - 1].latitude],
              ],
            ],
            spatialReference: { wkid: 4326 },
          })
          const distance = geometryEngine.geodesicLength(polyline, distanceUnit)
          graphics.push(
            new Graphic({
              geometry: offsetMapPoint,
              symbol: new TextSymbol({
                text: distance.toFixed(0) + distanceUnitShortName,
                color: 'black',
                haloColor: 'white',
                haloSize: 1,
                angle,
              }),
            }),
          )
        }

        measurementLayer.addMany(graphics)
        mapViewRef.current?.map.reorder(
          measurementLayer,
          mapViewRef.current?.map.layers.length,
        )
      }
    },
    [element],
  )

  const clearMeasurementLabels = React.useCallback(() => {
    if (measurementLayerRef.current) {
      measurementLayerRef.current.removeAll()
    }
  }, [])

  React.useEffect(() => {
    if (element.readOnly) return
    // event listeners for drawing tool creates/updates/deletes
    // these need to be removed and recreated when the submission value changes
    // to ensure they always have access to the latest submission value
    const createListener = sketchToolRef.current?.on(
      'create',
      throttle((sketchEvent: __esri.SketchCreateEvent) => {
        if (sketchEvent.state === 'active') {
          addMeasurementLabels([sketchEvent.graphic])
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
          clearMeasurementLabels()
        }
        if (sketchEvent.state === 'cancel') {
          setSelectedGraphicAttributes(undefined)
          clearMeasurementLabels()
        }
      }, 100),
    )

    const updateListener = sketchToolRef.current?.on(
      'update',
      throttle((sketchEvent: __esri.SketchUpdateEvent) => {
        if (sketchEvent.state === 'active') {
          addMeasurementLabels(sketchEvent.graphics)
        }
        if (sketchEvent.state === 'complete') {
          // only update the submission value if the graphic's geometry was actually changed
          if (
            JSON.stringify(sketchEvent.graphics[0].geometry.toJSON()) !==
            selectedGraphicForUpdate.current
          ) {
            updateDrawingInputSubmissionValue()
          }
          selectedGraphicForUpdate.current = undefined
          clearMeasurementLabels()
        }
        if (sketchEvent.state === 'start') {
          selectedGraphicForUpdate.current = JSON.stringify(
            sketchEvent.graphics[0].geometry.clone().toJSON(),
          )
          addMeasurementLabels(sketchEvent.graphics)
        }
      }, 100),
    )

    const deleteListener = sketchToolRef.current?.on('delete', () => {
      mapViewRef.current?.closePopup()
      updateDrawingInputSubmissionValue()
      clearMeasurementLabels()
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
          .find((r) => !!r.graphic.attributes?.label)

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
    clearMeasurementLabels,
  ])

  const stringifedLayersRef = React.useRef<string>('')

  const onSubmissionValueChange = React.useCallback(() => {
    const view = mapViewRef.current
    const map = mapViewRef.current?.map
    if (!view || !map) return

    // if the layers have changed or if the map has no layers, remove all layers and repaint
    const currentStringifedLayers = JSON.stringify(value?.layers)
    if (
      stringifedLayersRef.current !== currentStringifedLayers ||
      !map.layers.length
    ) {
      stringifedLayersRef.current = currentStringifedLayers
      // remove all layers and repaint
      map.layers.removeAll()
      if (defaultLayersRef.current) {
        // redraw default layers first
        defaultLayersRef.current.forEach((layer) => {
          map.add(layer)
        })
      }

      if (value?.layers) {
        for (const layer of value.layers) {
          const newLayer = new GraphicsLayer({
            title: layer.title as string,
            id: layer.id,
          })
          newLayer.addMany(layer.graphics.map((g) => Graphic.fromJSON(g)))
          newLayer.visible =
            typeof layer.visible === 'boolean' ? layer.visible : true
          map.layers.add(newLayer)
        }
      }
    }

    // add the web map's drawing and measurement layers back
    const drawingLayer = drawingLayerRef.current
    if (value?.drawingLayer && drawingLayer) {
      drawingLayer.removeAll()
      drawingLayer.addMany(value.drawingLayer.map((g) => Graphic.fromJSON(g)))
      map.layers.add(drawingLayer)
      map.layers.reorder(drawingLayer, map.layers.length - 1)
    }
    if (measurementLayerRef.current) {
      map.layers.add(measurementLayerRef.current)
      map.layers.reorder(measurementLayerRef.current, map.layers.length - 1)
    }
    if (value?.view) {
      view.zoom = value.view.zoom
      view.center = new Point({
        latitude: value.view.latitude,
        longitude: value.view.longitude,
      })
    }
  }, [value])

  React.useEffect(() => {
    if (!isLoading && mapViewRef.current) {
      onSubmissionValueChange()
    }
    // only run the above when the submission value changes or the map finishes loading
  }, [onSubmissionValueChange, isLoading])

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
          map,
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

        let drawingLayerId: string | undefined
        let measurementLayerId: string | undefined
        if (!element.readOnly && element.allowedDrawingTools?.length) {
          drawingLayerId = uuid()
          const drawingLayer = new GraphicsLayer({
            id: drawingLayerId,
            title: 'Drawing',
          })
          drawingLayerRef.current = drawingLayer
          map.layers.add(drawingLayer)

          // Add measurement layer above drawing layer
          if (element.measurementDimensionsEnabled) {
            measurementLayerId = uuid()
            const measurementLayer = new GraphicsLayer({
              id: measurementLayerId,
              title: 'Measurements',
              listMode: 'hide',
            })
            measurementLayerRef.current = measurementLayer
            map.layers.add(measurementLayer)
          }

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

          // when updating the map on submission value change,
          // we completely wipe all layers and redraw from scratch.
          // The below caters for web maps that load in with pre-existing layers,
          // which is usually the case when a web map id is provided.
          // We will store these pre-existing layers and ensure they're passed
          // to any redraw logic. We take layers from map.layers (as opposed to map.allLayers)
          // as this omits system generated layers like the basemap, which aren't removed when
          // we redraw regardless.
          defaultLayersRef.current = map.layers
            .toArray()
            .filter(
              (l) => l.id !== measurementLayerId && l.id !== drawingLayerId,
            )

          takeScreenShotRef.current = async (
            viewToScreenShot?: ArcGISTypes.ArcGISWebMapElementValue['view'],
          ) => {
            if (viewToScreenShot) {
              await view.goTo(
                {
                  center: [
                    viewToScreenShot.longitude,
                    viewToScreenShot.latitude,
                  ],
                  zoom: viewToScreenShot.zoom,
                },
                {
                  animate: true,
                },
              )
              console.log('waiting for view to render visible')
              await new Promise((resolve) => {
                if (!view.updating) {
                  resolve(undefined)
                } else {
                  const handle = view.watch('updating', (updating) => {
                    if (!updating) {
                      handle.remove()
                      resolve(undefined)
                    }
                  })
                }
              })
            }
            const screenshot = await view.takeScreenshot()
            return {
              dataUrl: screenshot.dataUrl,
            }
          }
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
  }, [drawingOptionsContainerId, element, isLoading, takeScreenShotRef, value])

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
      {isLoading && (
        <div className="figure-content-absolute-center">
          <OnLoading small />
        </div>
      )}
      <div
        className="arcgis-web-map"
        ref={ref}
        id={id}
        aria-describedby={props['aria-describedby']}
      />
      <div id={drawingOptionsContainerId}>
        {!!activeSketchToolMenu && sketchToolRef && (
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
            sketchTool={sketchToolRef}
          />
        )}
      </div>
    </>
  )
}

export default React.memo(FormElementArcGISWebMap)
