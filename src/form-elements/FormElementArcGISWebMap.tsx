import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { ArcGISTypes, FormTypes, SubmissionTypes } from '@oneblink/types'
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
import { generateArcGISAutomatedSnapshotFileName } from '../components/ArcGISWebMap'

const ArcGISWebMap = React.lazy(() => import('../components/ArcGISWebMap'))
export const defaultAutoSnapshotButtonLabel = 'Finish Drawing'

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
}: Props) {
  const ariaDescribedby = useElementAriaDescribedby(id, element)
  const isOffline = useIsOffline()
  const { isLookingUp } = React.useContext(LookupNotificationContext)
  const isDisplayingValidationMessage =
    (isDirty || displayValidationMessage) && !!validationMessage && !isLookingUp

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
        value: (existingValue) => ({
          ...existingValue,
          snapshotImages: (!data.value
            ? undefined
            : Array.isArray(data.value)
              ? data.value
              : data.value(
                  existingValue?.snapshotImages,
                )) as SubmissionTypes.FormSubmissionAttachment[],
        }),
      })
    },
    [element, onChange],
  )

  // Have a empty function to set is dirty because there are multiple ways
  // to provide input into this component and we don't want any of them
  // to trigger the validation message(s) for the other means of input.
  const fakeSetIsDirty = useCallback(() => undefined, [])
  const { removeAttachment, changeAttachment } = useAttachments(
    filesElement,
    handleChangeAttachments,
    fakeSetIsDirty,
  )

  const takeScreenShotRef = useRef<
    (view?: ArcGISTypes.ArcGISWebMapElementValue['view']) => Promise<{
      dataUrl: string
    }>
  >()

  const takeSnapshot = useCallback(
    async (
      fileName: string,
      view?: ArcGISTypes.ArcGISWebMapElementValue['view'],
    ) => {
      if (!takeScreenShotRef.current) {
        return
      }
      const takeScreenShot = takeScreenShotRef.current

      try {
        const screenshot = await takeScreenShot(view)
        const blob = await urlToBlobAsync(screenshot.dataUrl)
        const snapshotImage: unknown = prepareNewAttachment(
          blob,
          fileName,
          element,
        )
        onChange(element, {
          value: (existingValue) => ({
            ...existingValue,
            snapshotImages: [
              ...(existingValue?.snapshotImages || []),
              snapshotImage as SubmissionTypes.FormSubmissionAttachment,
            ],
          }),
        })
      } catch (error) {
        console.warn('Error taking manual screenshot', error)
        const snapshotImage: unknown = generateErrorAttachment(
          undefined,
          fileName,
          element,
          (error as Error).message,
        )
        onChange(element, {
          value: (existingValue) => ({
            ...existingValue,
            snapshotImages: [
              ...(existingValue?.snapshotImages || []),
              snapshotImage as SubmissionTypes.FormSubmissionAttachment,
            ],
          }),
        })
      }
    },
    [element, onChange],
  )

  const [isTakingManualSnapshot, setIsTakingManualSnapshot] = useState(false)
  const takeManualSnapshot = useCallback(async () => {
    setIsTakingManualSnapshot(true)
    await takeSnapshot(`${element.name}_manual.png`)
    setIsTakingManualSnapshot(false)
  }, [element.name, takeSnapshot])

  const automatedSnapshotFileName = useMemo(() => {
    return generateArcGISAutomatedSnapshotFileName(element)
  }, [element])
  const [isTakingAutoSnapshots, setIsTakingAutoSnapshots] = useState(false)
  const takeAutoSnapshots = useCallback(async () => {
    setIsTakingAutoSnapshots(true)
    onChange(element, {
      value: (existingValue) => ({
        ...existingValue,
        snapshotImages: existingValue?.snapshotImages?.filter(
          (snapshotImage) => {
            return snapshotImage.fileName !== automatedSnapshotFileName
          },
        ),
      }),
    })
    for (const autoSnapshotView of element.autoSnapshotViews || []) {
      await takeSnapshot(automatedSnapshotFileName, autoSnapshotView)
    }
    setIsTakingAutoSnapshots(false)
  }, [automatedSnapshotFileName, element, onChange, takeSnapshot])

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
                takeScreenShotRef={takeScreenShotRef}
              />
            </Suspense>
          </figure>
        )}

        {(!!element.manualSnapshotsEnabled ||
          !!element.autoSnapshotViews?.length) && (
          <div>
            <div className="buttons ob-buttons ob-arcgis-web-map__buttons">
              {!!element.manualSnapshotsEnabled && (
                <button
                  type="button"
                  className={clsx(
                    'is-primary button ob-button ob-button__capture-snapshot ob-arcgis-web-map__button cypress-arcgis-web-map-capture-snapshot-button',
                    {
                      'is-loading': isTakingManualSnapshot,
                    },
                  )}
                  onClick={takeManualSnapshot}
                  disabled={
                    element.readOnly ||
                    isTakingManualSnapshot ||
                    (!!element.maxManualSnapshots &&
                      (value?.snapshotImages?.filter(
                        (snapshotImage) =>
                          snapshotImage.fileName !== automatedSnapshotFileName,
                      )?.length || 0) >= element.maxManualSnapshots)
                  }
                >
                  <CustomisableButtonInner
                    label={
                      element.manualSnapshotButton?.label || 'Capture Image'
                    }
                    icon={element.manualSnapshotButton?.icon}
                  />
                </button>
              )}

              {!!element.autoSnapshotViews?.length && (
                <button
                  type="button"
                  className={clsx(
                    'is-primary button ob-button ob-button__finish-drawing ob-arcgis-web-map__button cypress-arcgis-web-map-finish-drawing-button',
                    {
                      'is-loading': isTakingAutoSnapshots,
                    },
                  )}
                  onClick={takeAutoSnapshots}
                  disabled={
                    element.readOnly ||
                    isTakingAutoSnapshots ||
                    value?.snapshotImages?.some(
                      (snapshotImage) =>
                        snapshotImage.fileName ===
                        generateArcGISAutomatedSnapshotFileName(element),
                    )
                  }
                >
                  <CustomisableButtonInner
                    label={
                      element.autoSnapshotButton?.label ||
                      defaultAutoSnapshotButtonLabel
                    }
                    icon={element.autoSnapshotButton?.icon}
                  />
                </button>
              )}
            </div>
          </div>
        )}

        {!!value?.snapshotImages?.length && (
          <div className="control cypress-files-control has-margin-top-9">
            <div className="columns is-multiline ob-columns-container">
              {value.snapshotImages.map(
                (snapshotImage, index, snapshotImages) => {
                  const attachment =
                    snapshotImage as unknown as attachmentsService.Attachment
                  return (
                    <FormElementFile
                      key={attachment.type ? attachment._id : attachment.id}
                      element={filesElement}
                      onRemove={
                        snapshotImage.fileName !== automatedSnapshotFileName
                          ? removeAttachment
                          : undefined
                      }
                      file={attachment}
                      onChange={changeAttachment}
                      disableUpload={
                        !!element.maxManualSnapshots &&
                        snapshotImages.filter(
                          (snapshotImage) =>
                            snapshotImage.fileName !==
                            automatedSnapshotFileName,
                        ).length > element.maxManualSnapshots
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
