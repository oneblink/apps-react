import React, { Suspense } from 'react'
import { FormTypes } from '@oneblink/types'
import OnLoading from '../components/renderer/OnLoading'
import useIsOffline from '../hooks/useIsOffline'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
const ArcGISWebMap = React.lazy(() => import('../components/ArcGISWebMap'))

type Props = {
  id: string
  element: FormTypes.ArcGISWebMapElement
  value: ArcGISWebMapElementValue | undefined
  onChange: FormElementValueChangeHandler<ArcGISWebMapElementValue>
  displayValidationMessage: boolean
  validationMessage: string | undefined
} & IsDirtyProps

export function stringifyArcgisInput(
  value: ArcGISWebMapElementValue | undefined,
) {
  return JSON.stringify(value?.userInput)
}

function FormElementArcGISWebMap({
  id,
  element,
  value,
  onChange,
  displayValidationMessage,
  isDirty,
  validationMessage,
  setIsDirty,
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isOffline = useIsOffline()
  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

  return (
    <div className="cypress-arcgis-web-map">
      <FormElementLabelContainer
        className="ob-arcgis-web-map"
        id={id}
        element={element}
        required={element.required}
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
              setIsDirty={setIsDirty}
            />
          </Suspense>
        )}
        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementArcGISWebMap)
