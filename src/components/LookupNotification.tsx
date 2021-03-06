import * as React from 'react'
import clsx from 'clsx'
import AbortController from 'abort-controller'
import { formService } from '@oneblink/apps'
import { generateHeaders } from '@oneblink/apps/dist/services/fetch'

import useIsOffline from '../hooks/useIsOffline'
import OnLoading from './OnLoading'
import generateDefaultData from '../services/generate-default-data'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useFormDefinition from '../hooks/useFormDefinition'
import useInjectPages from '../hooks/useInjectPages'
import useFormSubmissionModel from '../hooks/useFormSubmissionModelContext'
import useExecutedLookupCallback from '../hooks/useExecutedLookupCallback'
import useFormIsReadOnly from '../hooks/useFormIsReadOnly'
import { Sentry } from '@oneblink/apps'
import { FormTypes } from '@oneblink/types'
import useIsMounted from '../hooks/useIsMounted'
import { FormElementLookupHandler, FormSubmissionModel } from '../types/form'

type Props = {
  autoLookupValue?: unknown
  element: FormTypes.LookupFormElement
  onLookup: FormElementLookupHandler
  children: React.ReactNode
}

function LookupNotificationComponent({
  autoLookupValue,
  element,
  onLookup,
  children,
}: Props) {
  const isMounted = useIsMounted()
  const isOffline = useIsOffline()
  const definition = useFormDefinition()
  const injectPagesAfter = useInjectPages()
  const { executedLookup, executeLookupFailed } = useExecutedLookupCallback()

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
  const model = useFormSubmissionModel()

  const mergeLookupData = React.useCallback(
    (
      newValue,
      dataLookupResult,
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

  const triggerLookup = React.useCallback(
    async (newValue) => {
      // No lookups for read only forms
      if (formIsReadOnly) return
      // if the element triggering the lookup has no value..
      // ..return and do nothing
      if (newValue === undefined || newValue === null) return

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

      const abortController = new AbortController()
      setOnCancelLookup(() => () => abortController.abort())

      // After certain amount of time, show the cancel button
      const isCancellableTimeout = setTimeout(() => {
        setIsCancellable(!abortController.signal.aborted)
      }, 5000)

      const payload = {
        definition,
        submission: {
          ...model,
          [element.name]: newValue,
        },
      }

      try {
        const [dataLookupResult, elementLookupResult] = await Promise.all([
          fetchLookup(
            element.dataLookupId,
            definition?.organisationId,
            definition?.formsAppEnvironmentId,
            payload,
            abortController.signal,
          ),
          fetchLookup(
            element.elementLookupId,
            definition?.organisationId,
            definition?.formsAppEnvironmentId,
            payload,
            abortController.signal,
          ),
        ])

        mergeLookupData(newValue, dataLookupResult, elementLookupResult)

        if (isMounted.current) {
          setHasLookupSucceeded(true)
        }

        // After certain amount of time, hide the lookup succeeded message
        await new Promise((resolve) => setTimeout(() => resolve(false), 750))

        if (isMounted.current) {
          setIsLookingUp(false)
        }
      } catch (error) {
        executeLookupFailed(element)

        if (!isMounted.current) {
          return
        }

        // Cancelling will throw an error.
        if (error.name === 'AbortError') {
          console.log('Fetch aborted')
          setIsLookingUp(false)
          return
        }

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
      formIsReadOnly,
      isMounted,
      isOffline,
      mergeLookupData,
      model,
    ],
  )

  // For certain elements, do not add click event
  // instead, watch model for changes and trigger lookup function
  React.useEffect(() => {
    if (autoLookupValue !== undefined) {
      triggerLookup(autoLookupValue)
    }
    // Wants to use "triggerLookup" as a dependency,
    // however, this will change on any change made on any
    // element. Checking if "value" has changed is enough
    // to trigger a lookup when the correct dependencies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLookupValue])

  const contextValue = React.useMemo(
    () => ({
      isLookup: true,
      isDisabled,
      onLookup: triggerLookup,
    }),
    [isDisabled, triggerLookup],
  )

  return (
    <LookupNotificationContext.Provider value={contextValue}>
      {children}
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
                      dangerouslySetInnerHTML={{
                        __html: lookupErrorHTML || '',
                      }}
                      ng-bind-html="$ctrl.obLookupCtrl.lookupErrorMessage"
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

const LookupNotificationComponentMemo = React.memo(LookupNotificationComponent)

function LookupNotification(props: Props) {
  if (props.element.isDataLookup || props.element.isElementLookup) {
    return <LookupNotificationComponentMemo {...props} />
  }

  return <>{props.children}</>
}

export default React.memo(LookupNotification)

async function fetchLookup(
  formElementLookupId: number | undefined,
  organisationId: string | undefined,
  formsAppEnvironmentId: number | undefined,
  payload: FormSubmissionModel,
  abortSignal: AbortSignal,
) {
  if (
    typeof formElementLookupId !== 'number' ||
    !organisationId ||
    typeof formsAppEnvironmentId !== 'number'
  ) {
    return
  }

  console.log(
    'Attempting to retrieve form element lookup for id:',
    formElementLookupId,
  )
  const formElementLookup = await formService.getFormElementLookupById(
    organisationId,
    formsAppEnvironmentId,
    formElementLookupId,
  )

  if (!formElementLookup || !formElementLookup.url) {
    console.log(
      'Could not find URL for form element lookup for id:',
      formElementLookupId,
      formElementLookup,
    )
    throw new Error('Could not find element lookup configuration')
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

// Validate that an element with a lookup has had the lookup button pressed if the element is required
