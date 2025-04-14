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
import { Point } from '@arcgis/core/geometry'
import { v4 as uuid } from 'uuid'

import OnLoading from '../components/renderer/OnLoading'
import MaterialIcon from './MaterialIcon'

import useIsPageVisible from '../hooks/useIsPageVisible'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'

import '../styles/arcgis-external.css'

type Props = {
  element: FormTypes.ArcGISWebMapElement
  id: string
  value: ArcGISWebMapElementValue | undefined
  onChange: FormElementValueChangeHandler<ArcGISWebMapElementValue>
  'aria-describedby'?: string
  setIsDirty: () => void
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

  const [overlayLayerIds, setOverlayLayerIds] = React.useState<string[]>()
  const [loadError, setLoadError] = React.useState<Error>()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const isPageVisible = useIsPageVisible()
  const { isLookingUp } = React.useContext(LookupNotificationContext)

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

  React.useEffect(() => {
    if (element.readOnly) return
    // event listeners for drawing tool creates/updates/deletes
    // these need to be removed and recreated when the submission value changes
    // to ensure they always have access to the latest submission value
    const createListener = sketchToolRef.current?.on(
      'create',
      (sketchEvent) => {
        if (isLookingUp) {
          sketchToolRef.current?.cancel()
          return
        }
        if (sketchEvent.state === 'complete') {
          updateDrawingInputSubmissionValue()
        }
      },
    )

    const updateListener = sketchToolRef.current?.on(
      'update',
      (sketchEvent) => {
        if (isLookingUp) {
          sketchToolRef.current?.cancel()
          return
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
        }
        if (sketchEvent.state === 'start') {
          selectedGraphicForUpdate.current = JSON.stringify(
            sketchEvent.graphics[0].geometry.clone().toJSON(),
          )
        }
      },
    )

    const deleteListener = sketchToolRef.current?.on('delete', () => {
      if (isLookingUp) {
        sketchToolRef.current?.cancel()
        return
      }
      updateDrawingInputSubmissionValue()
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

    return () => {
      createListener?.remove()
      updateListener?.remove()
      deleteListener?.remove()
      mapViewChangeListener?.remove()
    }
  }, [
    isLoading,
    isLookingUp,
    value,
    updateDrawingInputSubmissionValue,
    updateMapViewSubmissionValue,
    element.readOnly,
  ])

  const onSubmissionValueChange = React.useCallback(() => {
    const view = mapViewRef.current
    const map = mapViewRef.current?.map
    if (!view || !map) return
    // remove any overlay layers we've added previously
    if (overlayLayerIds && map) {
      const layersToRemove = overlayLayerIds.reduce((toRemove: Layer[], id) => {
        const layer = map.layers.find((layer) => layer.id === id)
        if (layer) toRemove.push(layer)
        return toRemove
      }, [])
      map.layers.removeMany(layersToRemove)
    }

    // add any overlay layers in the submission value to the web map
    const newOverlayLayerIds = []
    if (value?.layers) {
      for (const layer of value.layers) {
        const overlayLayer = new GraphicsLayer({ title: layer.title as string })
        overlayLayer.addMany(layer.graphics.map((g) => Graphic.fromJSON(g)))
        newOverlayLayerIds.push(overlayLayer.id)
        map.layers.add(overlayLayer)
      }
    }
    setOverlayLayerIds(newOverlayLayerIds)

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
          'bottom-left',
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

        if (!element.readOnly) {
          const sketch = new Sketch({
            view,
            layer: drawingLayer,
            creationMode: 'single',
            layout: 'vertical',
            availableCreateTools: element.allowedDrawingTools?.map(
              (tool) => tool.type,
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
  }, [element, isLoading, value])

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
    </>
  )
}

export default React.memo(FormElementArcGISWebMap)
