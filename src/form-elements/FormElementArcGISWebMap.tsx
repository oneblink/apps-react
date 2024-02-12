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
import useIsOffline from '../hooks/useIsOffline'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'

type Props = {
  id: string
  element: FormTypes.ArcGISWebMapElement
}

function FormElementArcGISWebMap({ id, element }: Props) {
  const isOffline = useIsOffline()

  React.useEffect(() => {
    let view: MapView

    const loadMap = async () => {
      const map = new WebMap({
        portalItem: {
          id: element.webMapId,
        },
      })
      await map.load()

      view = new MapView({
        map: map,
        zoom: 7,
        container: 'arcGISMapView',
      })

      // remove default widgets
      const components = view.ui.getComponents()
      for (const component of components) {
        view.ui.remove(component)
      }

      view.ui.add(
        new Search({
          view,
        }),
        'top-left',
      )
      view.ui.add(
        new Home({
          view,
        }),
        'top-left',
      )
      view.ui.add(
        new Zoom({
          view,
        }),
        'bottom-left',
      )

      const layerList = new LayerList({
        view,
      })

      view.ui.add(
        new Expand({
          expandIcon: 'layers',
          view,
          content: layerList,
          expanded: element.showLayerPanel,
        }),
        'top-right',
      )

      const baseMapGallery = new BaseMapGallery({ view })

      view.ui.add(
        new Expand({
          expandIcon: 'basemap',
          view,
          content: baseMapGallery,
        }),
        'bottom-right',
      )
    }

    if (!isOffline) {
      loadMap()
    }

    return () => {
      if (view) {
        view.destroy()
      }
    }
  }, [element, isOffline])

  if (isOffline) {
    return (
      <figure className="ob-figure">
        <div className="figure-content has-text-centered">
          <h4 className="title is-4">
            This Web Map is not available as you are currently offline
          </h4>
        </div>
      </figure>
    )
  }

  return (
    <div className="cypress-arcgis-web-map">
      <FormElementLabelContainer
        className="ob-arcgis-web-map"
        id={id}
        element={element}
        required={false}
      >
        <div className="arcgis-web-map" id="arcGISMapView" />
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementArcGISWebMap)
