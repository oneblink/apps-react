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
import '../styles/arcgis-external.css'

type Props = {
  element: FormTypes.ArcGISWebMapElement
}

function FormElementArcGISWebMap({ element }: Props) {
  const [loadError, setLoadError] = React.useState<Error>()

  React.useEffect(() => {
    let view: MapView

    const loadMap = async () => {
      try {
        const map = new WebMap({
          portalItem: {
            id: element.webMapId,
          },
        })
        await map.load()

        view = new MapView({
          map: map,
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
            mode: 'floating',
          }),
          'top-right',
        )

        const baseMapGallery = new BaseMapGallery({ view })

        view.ui.add(
          new Expand({
            expandIcon: 'basemap',
            view,
            content: baseMapGallery,
            mode: 'floating',
          }),
          'bottom-right',
        )
      } catch (e) {
        console.warn('Error while trying to load arcgis web map ', e)
        setLoadError(e as Error)
      }
    }

    loadMap()

    return () => {
      if (view) {
        view.destroy()
      }
    }
  }, [element])

  if (loadError) {
    return (
      <figure className="ob-figure">
        <div className="figure-content has-text-centered">
          <i className="material-icons icon-large has-margin-bottom-6 has-text-warning">
            error
          </i>
          <h4 className="title is-4">We were unable to display your web map</h4>
          <p>{loadError.message}</p>
        </div>
      </figure>
    )
  }

  return <div className="arcgis-web-map" id="arcGISMapView" />
}

export default React.memo(FormElementArcGISWebMap)
