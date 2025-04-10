import * as React from 'react'
import clsx from 'clsx'
import CopyToClipboardButton from '../components/renderer/CopyToClipboardButton'
import { FormTypes, PointTypes } from '@oneblink/types'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { formService } from '@oneblink/apps'
import { Collapse } from '@mui/material'
import {
  NotificationGrid,
  NotificationGridItem,
} from '../components/NotificationGrid'
import MaterialIcon from '../components/MaterialIcon'

const pointCadastralParcelClass = 'ob-point-cadastral-parcel'

function FormElementPointCadastralParcel({
  id,
  formId,
  element,
  value,
  onChange,
  validationMessage,
  displayValidationMessage,
  isDirty,
  setIsDirty,
  autocompleteAttributes,
}: {
  id: string
  formId: number
  element: FormTypes.PointCadastralParcelElement
  value: PointTypes.PointCadastralParcelResponse | undefined
  onChange: FormElementValueChangeHandler<PointTypes.PointCadastralParcelResponse>
  displayValidationMessage: boolean
  validationMessage: string | undefined
  autocompleteAttributes?: string
} & IsDirtyProps) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const parcelId = value?.parcelBundle?.[0]?.parcelId
  const [label, setLabel] = React.useState(parcelId || '')
  const [{ isLoading, error }, setState] = React.useState<{
    isLoading: boolean
    error: Error | null
  }>({
    isLoading: false,
    error: null,
  })

  const loadCadastralParcel = React.useCallback(
    async (abortSignal: AbortSignal) => {
      if (!label || label === parcelId) {
        return
      }

      setState({
        isLoading: true,
        error: null,
      })

      try {
        console.log('Attempting to load NSW point cadastral parcel', {
          formId,
          parcelId: label,
        })
        const result = await formService.getPointCadastralParcel(
          formId,
          label,
          abortSignal,
        )
        if (!abortSignal.aborted) {
          onChange(element, {
            value: result,
          })
          setState({
            error: null,
            isLoading: false,
          })
        }
      } catch (err) {
        if (!abortSignal.aborted) {
          setState({
            isLoading: false,
            error: err as Error,
          })
        }
      }
    },
    [element, formId, label, onChange, parcelId],
  )

  // Ensure the label is set if the value is set outside of this component
  React.useEffect(() => {
    if (parcelId && label !== parcelId) {
      setLabel(parcelId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (((isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isLoading) ||
      error) &&
    !isLookingUp

  const hasCopyButton = !!value && !!element.readOnly
  return (
    <div className="cypress-point-cadastral-parcel-element">
      <FormElementLabelContainer
        className={pointCadastralParcelClass}
        id={id}
        element={element}
        required={element.required}
      >
        <div
          className={clsx('field has-addons', {
            'no-addons-mobile': !hasCopyButton,
          })}
        >
          <div
            className={clsx('control is-expanded has-icons-right', {
              'is-loading': isLoading,
              'has-icons-right': !isLoading,
            })}
          >
            <input
              type="text"
              id={id}
              name={element.name}
              className="input ob-input cypress-point-cadastral-parcel-control"
              placeholder={element.placeholderValue}
              value={label}
              onChange={(e) => {
                setLabel(e.target.value)
                if (value) {
                  onChange(element, {
                    value: undefined,
                  })
                }
              }}
              required={element.required}
              disabled={element.readOnly || isLoading}
              onBlur={() => {
                setIsDirty()
                loadCadastralParcel(new AbortController().signal)
              }}
              aria-describedby={ariaDescribedby}
              autoComplete={autocompleteAttributes}
            />
            {!isLoading && (
              <span className=" ob-input-icon icon is-small is-right">
                {value ? (
                  <MaterialIcon className="is-size-5 has-text-success">
                    check
                  </MaterialIcon>
                ) : error?.message ? (
                  <MaterialIcon className="is-size-5 has-text-danger">
                    error
                  </MaterialIcon>
                ) : (
                  <MaterialIcon className="is-size-5">map</MaterialIcon>
                )}
              </span>
            )}
          </div>
          {hasCopyButton && (
            <div className="control">
              <CopyToClipboardButton
                className="button is-input-addon copy-button cypress-copy-to-clipboard-button"
                text={label}
              />
            </div>
          )}
        </div>
        {isDisplayingValidationMessage && (
          <div role="alert" className="has-margin-top-8">
            <div className="has-text-danger ob-error__text cypress-validation-message">
              {error?.message || validationMessage}
            </div>
          </div>
        )}
      </FormElementLabelContainer>

      <Collapse in={!!value}>
        <NotificationGrid
          className={`${pointCadastralParcelClass}__record-display has-margin-top-6`}
          gridClassName={`${pointCadastralParcelClass}__container`}
        >
          <NotificationGridItem
            className={`${pointCadastralParcelClass}__container-address`}
            value={value?.features?.[0]?.properties?.formattedAddress}
            label="Address"
            labelClassName={`${pointCadastralParcelClass}__detail-label`}
            valueClassName={`${pointCadastralParcelClass}__detail-value`}
          />
          <NotificationGridItem
            className={`${pointCadastralParcelClass}__container-lots`}
            value={value?.features?.[0]?.properties?.propertyBundle?.[0]?.parcelIds?.join(
              ', ',
            )}
            label="Lots"
            labelClassName={`${pointCadastralParcelClass}__detail-label`}
            valueClassName={`${pointCadastralParcelClass}__detail-value`}
          />
          <NotificationGridItem
            className={`${pointCadastralParcelClass}__container-local-government-area-name`}
            value={
              value?.features?.[0]?.properties?.localGovernmentArea?.lgaName
            }
            label="Local Government Area"
            labelClassName={`${pointCadastralParcelClass}__detail-label`}
            valueClassName={`${pointCadastralParcelClass}__detail-value`}
          />
        </NotificationGrid>
      </Collapse>
    </div>
  )
}

export default React.memo(FormElementPointCadastralParcel)
