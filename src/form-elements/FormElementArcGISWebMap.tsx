import React, { Suspense } from 'react'
import { FormTypes } from '@oneblink/types'
import OnLoading from '../components/renderer/OnLoading'
import useIsOffline from '../hooks/useIsOffline'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useFormIsReadOnly from '../hooks/useFormIsReadOnly'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'

const ArcGISWebMap = React.lazy(() => import('../components/ArcGISWebMap'))

type Props = {
  id: string
  element: FormTypes.ArcGISWebMapElement
}

function FormElementArcGISWebMap({ id, element }: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isOffline = useIsOffline()
  const isFormReadOnly = useFormIsReadOnly()

  if (isFormReadOnly) {
    return null
  }

  return (
    <div className="cypress-arcgis-web-map">
      <FormElementLabelContainer
        className="ob-arcgis-web-map"
        id={id}
        element={element}
        required={false}
      >
        {isOffline ? (
          <figure className="ob-figure">
            <div className="figure-content has-text-centered">
              <h4 className="title is-4">
                This Web Map is not available as you are currently offline
              </h4>
            </div>
          </figure>
        ) : (
          <Suspense
            fallback={
              <>
                <OnLoading />
                <div className="arcgis-web-map" />
              </>
            }
          >
            <ArcGISWebMap
              element={element}
              id={id}
              aria-describedby={ariaDescribedby}
            />
          </Suspense>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementArcGISWebMap)
