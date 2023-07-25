import * as React from 'react'
import clsx from 'clsx'
import { generateHeaders } from '@oneblink/apps/dist/services/fetch'

import useIsOffline from '../../hooks/useIsOffline'
import OnLoading from './OnLoading'
import generateDefaultData from '../../services/generate-default-data'
import {
  LookupNotificationContext,
  LookupNotificationContextValue,
} from '../../hooks/useLookupNotification'
import useFormDefinition from '../../hooks/useFormDefinition'
import useInjectPages from '../../hooks/useInjectPages'
import useFormSubmissionModel from '../../hooks/useFormSubmissionModelContext'
import useExecutedLookupCallback from '../../hooks/useExecutedLookupCallback'
import useFormIsReadOnly from '../../hooks/useFormIsReadOnly'
import { Sentry, formService } from '@oneblink/apps'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useIsMounted from '../../hooks/useIsMounted'
import { FormElementLookupHandler } from '../../types/form'
import useFormElementLookups from '../../hooks/useFormElementLookups'
import ErrorMessage from '../messages/ErrorMessage'

type FetchLookupPayload = {
  element: FormTypes.LookupFormElement
  definition: FormTypes.Form
  submission: SubmissionTypes.S3SubmissionData['submission']
}
type Props = {
  autoLookupValue?: unknown
  stringifyAutoLookupValue?: (autoLookupValue: unknown) => string
  element: FormTypes.LookupFormElement
  onLookup: FormElementLookupHandler
  children: React.ReactNode
}

function LookupNotificationComponent({
  autoLookupValue,
  stringifyAutoLookupValue,
  element,
  onLookup,
  children,
}: Props) {
  const isMounted = useIsMounted()
  const isOffline = useIsOffline()
  const definition = useFormDefinition()
  const injectPagesAfter = useInjectPages()
  const { executedLookup, executeLookupFailed } = useExecutedLookupCallback()
  const { isLoading, formElementLookups, loadError, onTryAgain } =
    useFormElementLookups()

  const [onCancelLookup, setOnCancelLookup] = React.useState<
    (() => void) | undefined
  >(undefined)
  const [isLookingUp, setIsLookingUp] = React.useState(false)
  const [hasLookupFailed, setHasLookupFailed] = React.useState(false)
  const [hasLookupSucceeded, setHasLookupSucceeded] = React.useState(false)
  const [isCancellable, setIsCancellable] = React.useState(false)
  const [isDisabled, setIsDisabled] = React.useState(false)
  const [lookupErrorHTML, setLookupErrorHTML] = React.useState<string | null>(
    null,
  )
  const formIsReadOnly = useFormIsReadOnly()
  const { formSubmissionModel: model } = useFormSubmissionModel()

  const formElementElementLookup = React.useMemo(() => {
    return formElementLookups.find(
      ({ id }) => element.isElementLookup && id === element.elementLookupId,
    )
  }, [element.elementLookupId, element.isElementLookup, formElementLookups])

  const formElementDataLookup = React.useMemo(() => {
    return formElementLookups.find(
      ({ id }) => element.isDataLookup && id === element.dataLookupId,
    )
  }, [element.dataLookupId, element.isDataLookup, formElementLookups])

  const runLookupOnClear = React.useMemo<boolean>(() => {
    return !!(
      formElementDataLookup?.runLookupOnClear ||
      formElementElementLookup?.runLookupOnClear
    )
  }, [
    formElementDataLookup?.runLookupOnClear,
    formElementElementLookup?.runLookupOnClear,
  ])

  const mergeLookupData = React.useCallback(
    (
      newValue: unknown,
      dataLookupResult: SubmissionTypes.S3SubmissionData['submission'],
      elementLookupResult: FormTypes.FormElement[],
    ) => {
      if (elementLookupResult) {
        if (elementLookupResult[0] && elementLookupResult[0].type === 'page') {
          injectPagesAfter(
            element,
            elementLookupResult as FormTypes.PageElement[],
            dataLookupResult,
          )
          return
        }
      }

      onLookup(({ submission, elements }) => {
        let allElements = elements
        if (Array.isArray(elementLookupResult)) {
          const indexOfElement = elements.findIndex(
            ({ id }) => id === element.id,
          )
          if (indexOfElement === -1) {
            console.log('Could not find element', element)
          } else {
            // Filter out already injected elements
            allElements = elements.filter(
              // @ts-expect-error Sorry typescript, we need to check a property you don't approve of :(
              (e) => e.injectedByElementId !== element.id,
            )
            allElements.splice(
              indexOfElement + 1,
              0,
              ...elementLookupResult.map((e) => {
                // @ts-expect-error Sorry typescript, we need to check a property you don't approve of :(
                e.injectedByElementId = element.id
                return e
              }),
            )
          }
        }

        return {
          elements: allElements,
          submission: generateDefaultData(allElements, {
            ...submission,
            [element.name]: newValue,
            ...dataLookupResult,
          }),
        }
      })
    },
    [element, injectPagesAfter, onLookup],
  )

  const triggerLookup = React.useCallback<
    LookupNotificationContextValue['onLookup']
  >(
    async ({ newValue, abortController, continueLookupOnAbort }) => {
      // No lookups for read only forms
      if (formIsReadOnly) return

      setIsLookingUp(true)

      if (isOffline) {
        setHasLookupFailed(true)
        return
      }

      executedLookup(element)
      setIsDisabled(true)
      setIsCancellable(false)
      setHasLookupFailed(false)
      setHasLookupSucceeded(false)
      setLookupErrorHTML(null)
      setOnCancelLookup(() => () => {
        if (isMounted.current) {
          setIsLookingUp(false)
        }
        abortController.abort()
      })

      // After certain amount of time, show the cancel button
      const isCancellableTimeout = setTimeout(() => {
        setIsCancellable(!abortController.signal.aborted)
      }, 5000)

      const payload: FetchLookupPayload = {
        element,
        definition,
        submission: {
          ...model,
          [element.name]: newValue,
        },
      }

      try {
        const [dataLookupResult, elementLookupResult] = await Promise.all([
          fetchLookup(formElementDataLookup, payload, abortController.signal),
          fetchLookup(
            formElementElementLookup,
            payload,
            abortController.signal,
          ),
        ])

        mergeLookupData(newValue, dataLookupResult, elementLookupResult)

        if (isMounted.current) {
          setHasLookupSucceeded(true)
        }

        // After certain amount of time, hide the lookup succeeded message
        setTimeout(() => {
          if (isMounted.current) {
            setIsLookingUp(false)
          }
        }, 750)
      } catch (error) {
        if (!isMounted.current) {
          return
        }

        if (abortController.signal.aborted) {
          console.log('Fetch aborted')
          if (!continueLookupOnAbort) {
            setIsLookingUp(false)
          }
          return
        }

        executeLookupFailed(element)

        setHasLookupFailed(true)
        setLookupErrorHTML(
          typeof error === 'string'
            ? error
            : 'It looks like something went wrong.<br/>Please try again.<br />If the issue continues, please contact support.',
        )
      } finally {
        clearTimeout(isCancellableTimeout)
        if (isMounted.current) {
          setIsDisabled(false)
          setOnCancelLookup(undefined)
        }
      }
    },
    [
      definition,
      element,
      executeLookupFailed,
      executedLookup,
      formElementDataLookup,
      formElementElementLookup,
      formIsReadOnly,
      isMounted,
      isOffline,
      mergeLookupData,
      model,
    ],
  )

  // For certain elements, do not add click event
  // instead, watch model for changes and trigger lookup function.
  // We add this stringify function here to allow the value to be
  // an object which may have a reference change, but the values
  // have not changed. e.g. the 'location' element's value
  const autoLookupValueString = stringifyAutoLookupValue
    ? stringifyAutoLookupValue(autoLookupValue)
    : autoLookupValue
  React.useEffect(() => {
    if (isLoading || loadError) {
      return
    }
    const hasLookupRan = hasLookupFailed || hasLookupSucceeded

    // For lookups configured with `runLookupOnClear` set to true, we want to
    // allow empty values for `autoLookupValue`, but only if the lookup has
    // been ran previously. This prevents the lookup running on load with an empty value.
    if (!autoLookupValue && (!runLookupOnClear || !hasLookupRan)) {
      setIsLookingUp(false)
      return
    }
    const abortController = new AbortController()
    triggerLookup({
      newValue: autoLookupValue,
      abortController,
      continueLookupOnAbort: true,
    })
    return () => {
      abortController.abort()
    }
    // Wants to use "triggerLookup" as a dependency,
    // however, this will change on any change made on any
    // element. Checking if "value" has changed is enough
    // to trigger a lookup when the correct dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLookupValueString, isLoading])

  const contextValue = React.useMemo(
    () => ({
      isLookup: true,
      isDisabled,
      isLoading,
      onLookup: triggerLookup,
      allowLookupOnEmptyValue: runLookupOnClear,
    }),
    [isDisabled, isLoading, runLookupOnClear, triggerLookup],
  )

  return (
    <LookupNotificationContext.Provider value={contextValue}>
      {children}

      {loadError && (
        <ErrorMessage
          title="Error Loading Configuration"
          onTryAgain={onTryAgain}
        >
          <span className="cypress-lookup-notification-loading-error">
            {loadError.message}
          </span>
        </ErrorMessage>
      )}

      <div
        className={clsx('ob-lookup__notification', {
          'is-looking-up': isLookingUp,
          'is-extended':
            hasLookupFailed || (isCancellable && !hasLookupSucceeded),
        })}
      >
        <div className="notification has-margin-top-7 has-text-centered">
          {hasLookupFailed && (
            <>
              <button
                type="button"
                className="delete fade-in"
                onClick={() => setIsLookingUp(false)}
              />

              <div>
                {isOffline ? (
                  <div>
                    <i className="material-icons fade-in has-text-warning">
                      wifi_off
                    </i>
                    <p className="fade-in">
                      It looks like you&apos;re offline. Please try again when
                      connectivity is restored.
                    </p>
                  </div>
                ) : (
                  <div>
                    <i className="material-icons fade-in has-text-danger">
                      error_outline
                    </i>
                    <p
                      className="fade-in"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{
                        __html: lookupErrorHTML || '',
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {hasLookupSucceeded && (
            <i className="material-icons has-text-success fade-in">
              check_circle_outline
            </i>
          )}

          {!hasLookupSucceeded && !hasLookupFailed && <OnLoading small />}

          {isCancellable && !hasLookupSucceeded && !hasLookupFailed && (
            <div className="has-margin-top-5 fade-in">
              <p>Taking longer than expected?</p>
              <button
                type="button"
                className="button has-margin-top-8"
                onClick={onCancelLookup}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </LookupNotificationContext.Provider>
  )
}

export default function LookupNotification(props: Props) {
  if (props.element.isDataLookup || props.element.isElementLookup) {
    return <LookupNotificationComponent {...props} />
  }

  return <>{props.children}</>
}

async function fetchLookup(
  formElementLookup: formService.FormElementLookupResult | undefined,
  payload: FetchLookupPayload,
  abortSignal: AbortSignal,
) {
  if (formElementLookup?.records) {
    const elementName = payload.element.name
    const inputValue = payload.submission[elementName]

    const matchingRecord = formElementLookup.records.find(
      (r) =>
        (r.inputType === 'UNDEFINED' && !inputValue) ||
        (r.inputType !== 'UNDEFINED' && r.inputValue === inputValue),
    )

    // insert prefill values
    return matchingRecord?.preFills.reduce<
      SubmissionTypes.S3SubmissionData['submission']
    >((lookupResult, prefill) => {
      switch (prefill.type) {
        case 'TEXT':
          lookupResult[prefill.formElementName] = prefill.text
          break
        case 'NUMBER':
          lookupResult[prefill.formElementName] = prefill.number
          break
        case 'CLEAR':
          lookupResult[prefill.formElementName] = undefined
          break
      }
      return lookupResult
    }, {})
  }

  if (!formElementLookup?.url) {
    return
  }

  const headers = await generateHeaders()
  console.log(
    `Attempting a ${formElementLookup.type} lookup request to:`,
    formElementLookup.url,
  )
  const response = await fetch(formElementLookup.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: abortSignal,
  })

  const data = await response.json()
  console.log(
    'Response from lookup to: POST',
    formElementLookup.url,
    response.status,
    data,
  )

  if (!response.ok) {
    Sentry.captureException(
      new Error(`Received ${response.status} status code from lookup`),
    )
    if (response.status === 400 && data && data.message) {
      throw data.message
    }
    throw new Error('Invalid response from lookup')
  }

  return data
}
