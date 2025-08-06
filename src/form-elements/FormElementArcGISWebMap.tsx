import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import OnLoading from '../components/renderer/OnLoading'
import useIsOffline from '../hooks/useIsOffline'
import FormElementLabelContainer from '../components/renderer/FormElementLabelContainer'
import useElementAriaDescribedby from '../hooks/useElementAriaDescribedby'
import { ArcGISWebMapElementValue } from '@oneblink/types/typescript/arcgis'
import { FormElementValueChangeHandler, IsDirtyProps } from '../types/form'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import FormElementValidationMessage from '../components/renderer/FormElementValidationMessage'
import { urlToBlobAsync } from '../services/blob-utils'
import {
  generateErrorAttachment,
  prepareNewAttachment,
} from '../services/attachments'
import clsx from 'clsx'
import { attachmentsService } from '@oneblink/apps'
import FormElementFile from './FormElementFile'
import useAttachments from '../hooks/attachments/useAttachments'
import CustomisableButtonInner from '../components/renderer/CustomisableButtonInner'

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
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false)

  const filesElement = useMemo<FormTypes.FilesElement>(() => {
    return {
      ...element,
      type: 'files',
      restrictFileTypes: false,
    }
  }, [element])

  const handleChangeAttachments = useCallback<
    FormElementValueChangeHandler<attachmentsService.Attachment[]>
  >(
    (e, data) => {
      onChange(element, {
        value: {
          ...value,
          snapshotImages: (!data.value
            ? undefined
            : Array.isArray(data.value)
              ? data.value
              : data.value(
                  value?.snapshotImages,
                )) as SubmissionTypes.FormSubmissionAttachment[],
        },
      })
    },
    [element, onChange, value],
  )

  const { removeAttachment, changeAttachment } = useAttachments(
    filesElement,
    handleChangeAttachments,
    setIsDirty,
  )

  const takeScreenShotRef = useRef<
    () => Promise<{
      dataUrl: string
    }>
  >()

  const handleTakeSnapshot = useCallback(async () => {
    if (!takeScreenShotRef.current) {
      return
    }

    setIsTakingSnapshot(true)
    const fileName = `${element.name}.png`
    try {
      const screenshot = await takeScreenShotRef.current()
      const blob = await urlToBlobAsync(screenshot.dataUrl)
      const snapshotImage: unknown = prepareNewAttachment(
        blob,
        fileName,
        element,
      )
      onChange(element, {
        value: {
          ...value,
          snapshotImages: [
            ...(value?.snapshotImages || []),
            snapshotImage as SubmissionTypes.FormSubmissionAttachment,
          ],
        },
      })
      setIsDirty()
    } catch (error) {
      console.warn('Error taking screenshot', error)
      const snapshotImage: unknown = generateErrorAttachment(
        undefined,
        fileName,
        element,
        (error as Error).message,
      )
      onChange(element, {
        value: {
          ...value,
          snapshotImages: [
            ...(value?.snapshotImages || []),
            snapshotImage as SubmissionTypes.FormSubmissionAttachment,
          ],
        },
      })
    } finally {
      setIsTakingSnapshot(false)
    }
  }, [element, onChange, setIsDirty, value])

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
          <figure className="ob-figure">
            <Suspense
              fallback={
                <div className="arcgis-web-map figure-content-absolute-center">
                  <OnLoading small />
                </div>
              }
            >
              <ArcGISWebMap
                element={element}
                id={id}
                aria-describedby={ariaDescribedby}
                value={value}
                onChange={onChange}
                setIsDirty={setIsDirty}
                takeScreenShotRef={takeScreenShotRef}
              />
            </Suspense>
          </figure>
        )}

        {!!element.snapshotImagesEnabled && (
          <button
            type="button"
            className={clsx(
              'is-primary button ob-button ob-button__capture-snapshot ob-arcgis-web-map__button cypress-arcgis-web-map-capture-snapshot-button',
              {
                'is-loading': isTakingSnapshot,
              },
            )}
            onClick={handleTakeSnapshot}
            disabled={
              element.readOnly ||
              isTakingSnapshot ||
              (!!element.maxSnapshotImages &&
                (value?.snapshotImages?.length || 0) >=
                  element.maxSnapshotImages)
            }
          >
            <CustomisableButtonInner
              label={element.snapshotImageButtonText || 'Capture Image'}
              icon={element.snapshotImageButtonIcon}
            />
          </button>
        )}

        {!!value?.snapshotImages?.length && (
          <div className="control cypress-files-control has-margin-top-7">
            <div className="columns is-multiline ob-columns-container">
              {value.snapshotImages.map(
                (snapshotImage, index, snapshotImages) => {
                  const attachment =
                    snapshotImage as unknown as attachmentsService.Attachment
                  return (
                    <FormElementFile
                      key={attachment.type ? attachment._id : attachment.id}
                      element={filesElement}
                      onRemove={removeAttachment}
                      file={attachment}
                      onChange={changeAttachment}
                      disableUpload={
                        !!element.maxSnapshotImages &&
                        snapshotImages.length > element.maxSnapshotImages
                      }
                      index={index}
                    />
                  )
                },
              )}
            </div>
          </div>
        )}

        {isDisplayingValidationMessage && (
          <FormElementValidationMessage message={validationMessage} />
        )}
      </FormElementLabelContainer>
    </div>
  )
}

export default React.memo(FormElementArcGISWebMap)
