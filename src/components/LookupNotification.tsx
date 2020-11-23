import * as React from 'react'
import clsx from 'clsx'
import AbortController from 'abort-controller'
import { formService, authService } from '@oneblink/apps'

import useIsOffline from '../hooks/useIsOffline'
import OnLoading from './OnLoading'
import generateDefaultData from '../services/generate-default-data'
import { LookupNotificationContext } from '../hooks/useLookupNotification'
import useFormDefinition from '../hooks/useFormDefinition'
import useInjectPages from '../hooks/useInjectPages'
import cleanFormElementsCtrlModel from '../services/clean-form-elements-ctrl-model'
import useExecutedLookupCallback from '../hooks/useExecutedLookupCallback'
import { FormTypes } from '@oneblink/types'

type Props = {
  isAutoLookup?: boolean
  element: FormTypes.LookupFormElement
  value: unknown | undefined
  formElementsCtrl: FormElementsCtrl
  formElementsConditionallyShown: FormElementsConditionallyShown | undefined
  onChangeElements: (formElements: FormTypes.FormElement[]) => void
  onChangeModel: (model: FormElementsCtrl['model']) => void
  children: React.ReactNode
}

function LookupNotificationComponent({
  isAutoLookup,
  element,
  value,
  formElementsCtrl,
  formElementsConditionallyShown,
  onChangeElements,
  onChangeModel,
  children,
}: Props) {
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

  const mergeLookupData = React.useCallback(
    (dataLookupResult, elementLookupResult: FormTypes.FormElement[]) => {
      let defaultElementData: FormElementsCtrl['model'] | undefined

      if (elementLookupResult) {
        if (elementLookupResult[0] && elementLookupResult[0].type === 'page') {
          // @ts-expect-error ???
          injectPagesAfter(element, elementLookupResult)
          return
        }

        // @ts-expect-error ???
        const indexOfElement = formElementsCtrl.elements.indexOf(element)
        if (indexOfElement === -1) {
          console.log('Could not find element', element)
        } else {
          defaultElementData = generateDefaultData(
            elementLookupResult,
            formElementsCtrl.model,
          )

          // Filter out already injected elements
          const allElements = formElementsCtrl.elements.filter(
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

          onChangeElements(allElements)
        }
      }

      onChangeModel({
        ...defaultElementData,
        ...formElementsCtrl.model,
        ...dataLookupResult,
      })
    },
    [
      element,
      formElementsCtrl.elements,
      formElementsCtrl.model,
      injectPagesAfter,
      onChangeElements,
      onChangeModel,
    ],
  )

  const triggerLookup = React.useCallback(async () => {
    // if the element triggering the lookup has no value..
    // ..return and do nothing
    if (value === undefined || value === null) return

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
      submission: cleanFormElementsCtrlModel(
        formElementsCtrl,
        formElementsConditionallyShown,
        true,
      ).model,
    }

    try {
      const [dataLookupResult, elementLookupResult] = await Promise.all([
        fetchLookup(
          element.dataLookupId,
          definition,
          payload,
          abortController.signal,
        ),
        fetchLookup(
          element.elementLookupId,
          definition,
          payload,
          abortController.signal,
        ),
      ])

      mergeLookupData(dataLookupResult, elementLookupResult)

      setHasLookupSucceeded(true)

      // After certain amount of time, hide the lookup succeeded message
      await new Promise((resolve) => setTimeout(() => resolve(false), 750))

      setIsLookingUp(false)
    } catch (error) {
      executeLookupFailed(element)
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
      setIsDisabled(false)
      setOnCancelLookup(undefined)
    }
  }, [
    definition,
    element,
    executeLookupFailed,
    executedLookup,
    formElementsConditionallyShown,
    formElementsCtrl,
    isOffline,
    mergeLookupData,
    value,
  ])

  // For certain elements, do not add click event
  // instead, watch model for changes and trigger lookup function
  React.useEffect(() => {
    if (isAutoLookup) {
      triggerLookup()
    }
    // Wants to use "triggerLookup" as a dependency,
    // however, this will change on any change made on any
    // element. Checking if "value" has changed is enough
    // to trigger a lookup when the correct values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoLookup, value])

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
  form: FormTypes.Form | undefined,
  payload: FormElementsCtrl['model'],
  abortSignal: AbortSignal,
) {
  if (typeof formElementLookupId !== 'number' || !form) {
    return
  }

  console.log(
    'Attempting to retrieve form element lookup for id:',
    formElementLookupId,
  )
  const formElementLookup = await formService.getFormElementLookupById(
    form.organisationId,
    form.formsAppEnvironmentId,
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

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  // Check auth service for a token if user is logged in
  const idToken = await authService.getIdToken()
  if (idToken) {
    headers = {
      ...headers,
      Authorization: `Bearer ${idToken}`,
    }
  }

  const userToken = authService.getUserToken()
  if (userToken) {
    headers['X-OneBlink-User-Token'] = userToken
  }

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
    if (response.status === 400 && data && data.message) {
      throw data.message
    } else {
      throw new Error('Invalid response from lookup')
    }
  }

  return data
}

// Validate that an element with a lookup has had the lookup button pressed if the element is required
