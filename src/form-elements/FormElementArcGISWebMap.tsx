import React, { Suspense } from 'react'
import { FormTypes } from '@oneblink/types'
import OnLoading from '../components/renderer/OnLoading'
import useIsOffline from '../hooks/useIsOffline'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useFormIsReadOnly from '../hooks/useFormIsReadOnly'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler } from '../types/form'
const ArcGISWebMap = React.lazy(() => import('../components/ArcGISWebMap'))

type Props = {
  id: string
  element: FormTypes.ArcGISWebMapElement
  value: ArcGISWebMapElementValue | undefined
  onChange: FormElementValueChangeHandler<ArcGISWebMapElementValue>
}

export function stringifyArcgisInput(
  value: ArcGISWebMapElementValue | undefined,
) {
  return JSON.stringify(value?.userInput)
}

function FormElementArcGISWebMap({ id, element, value, onChange }: Props) {
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
              <h4 className="title is-4" role="alert">
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
              value={value}
              onChange={onChange}
            />
          </Suspense>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementArcGISWebMap)
