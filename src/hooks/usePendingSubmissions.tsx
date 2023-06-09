import * as React from 'react'
import { submissionService } from '@oneblink/apps'
import useBooleanState from './useBooleanState'
import useIsMounted from './useIsMounted'
import useIsOffline from './useIsOffline'

/** The value returned from `usePendingSubmissions()` hook */
export type PendingSubmissionsContextValue = {
  /** `true` if the pending submissions are currently loading */
  isLoading: boolean
  /** An Error object if loading pending submissions fails */
  loadError: Error | null
  /**
   * The submissions that were submitted offline and can be processed when back
   * online
   */
  pendingSubmissions: submissionService.PendingFormSubmission[]
  /** `true` submissions that where submitted offline are being processed */
  isProcessingPendingQueue: boolean
  /** A function to trigger processing of the pending queue */
  processPendingQueue: () => unknown
  /**
   * A function to trigger loading of the submissions that were submitted
   * offline
   */
  reloadPendingSubmissions: () => unknown
  /** A function to remove a submission from the pending submissions */
  deletePendingSubmission: (pendingTimestamp: string) => unknown
  /** `true` if a submission being processed fails */
  isShowingFailedNotification: boolean
  /** A function to hide the notification when a submission fails to process */
  hideFailedNotification: () => unknown
  /** `true` if a submission being processed completes successfully. */
  isShowingSuccessNotification: boolean
}

const defaultState = {
  isLoading: false,
  loadError: null,
  pendingSubmissions: [],
}

const PendingSubmissionsContext =
  React.createContext<PendingSubmissionsContextValue>({
    ...defaultState,
    reloadPendingSubmissions: () => {},
    processPendingQueue: () => {},
    deletePendingSubmission: () => {},
    isProcessingPendingQueue: false,
    isShowingFailedNotification: false,
    hideFailedNotification: () => {},
    isShowingSuccessNotification: false,
  })

/**
 * React Component that provides the context for the `usePendingSubmissions()`
 * hook to be used by components further down your component tree. **It should
 * only be included in your component tree once and ideally at the root of the
 * application.**
 *
 * #### Example
 *
 * ```jsx
 * import * as React from 'react'
 * import {
 *   PendingSubmissionsContextProvider,
 *   usePendingSubmissions,
 * } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const pendingSubmissionsContext = usePendingSubmissions()
 *   // use pending submissions here
 * }
 *
 * function App() {
 *   return (
 *     <PendingSubmissionsContextProvider
 *       isPendingQueueEnabled
 *       successNotificationTimeoutMs={3000}
 *     >
 *       <Component />
 *     </PendingSubmissionsContextProvider>
 *   )
 * }
 *
 * const root = document.getElementById('root')
 * if (root) {
 *   ReactDOM.render(<App />, root)
 * }
 * ```
 *
 * @param props
 * @returns
 * @group Components
 */
export function PendingSubmissionsContextProvider({
  isPendingQueueEnabled,
  successNotificationTimeoutMs = 500,
  children,
}: {
  /**
   * `true` if pending queue is enabled, otherwise `false`. Can be used prevent
   * offline submissions from being processed.
   */
  isPendingQueueEnabled: boolean
  /**
   * When a submission is processed successfully the
   * `isShowingSuccessNotification` will be temporarily set to `true`, it will
   * be set back to `false` after 5 seconds. This prop will allow you to
   * customise how long to wait before hiding the notification with a
   * milliseconds value.
   */
  successNotificationTimeoutMs?: number
  /** Your application components */
  children: React.ReactNode
}) {
  const isMounted = useIsMounted()
  const isOffline = useIsOffline()

  // Using a number as state so we can reset the timer used to close
  // the snack bar each time a pending queue item is processed
  const [submittedNotificationCount, setSubmittedNotificationCount] =
    React.useState(0)
  const [
    isShowingFailedNotification,
    showFailedNotification,
    hideFailedNotification,
  ] = useBooleanState(false)
  const [isProcessingPendingQueue, setIsProcessingPendingQueue] =
    React.useState(false)
  const [state, setState] = React.useState<{
    isLoading: boolean
    loadError: Error | null
    pendingSubmissions: submissionService.PendingFormSubmission[]
  }>(defaultState)

  const processPendingQueue = React.useCallback(async () => {
    if (isMounted.current) {
      setIsProcessingPendingQueue(true)
    }

    await submissionService.processPendingQueue({
      shouldRunExternalIdGeneration: true,
      shouldRunServerValidation: true,
    })

    if (isMounted.current) {
      setIsProcessingPendingQueue(false)
    }
  }, [isMounted])

  const reloadPendingSubmissions = React.useCallback(async () => {
    if (isMounted.current) {
      setState((currentState) => ({
        isLoading: true,
        loadError: null,
        pendingSubmissions: currentState.pendingSubmissions,
      }))
    }
    let newError = null
    let newPendingSubmissions: submissionService.PendingFormSubmission[] = []

    try {
      newPendingSubmissions =
        await submissionService.getPendingQueueSubmissions()
    } catch (error) {
      newError = error as Error
    }

    if (isMounted.current) {
      setState({
        isLoading: false,
        loadError: newError,
        pendingSubmissions: newPendingSubmissions,
      })
    }
  }, [isMounted])

  React.useEffect(() => {
    if (!isPendingQueueEnabled) {
      return
    }
    reloadPendingSubmissions()
    return submissionService.registerPendingQueueListener(
      (pendingSubmissions, action) => {
        switch (action) {
          case 'SUBMIT_SUCCEEDED': {
            setSubmittedNotificationCount((current) => current + 1)
            break
          }
          case 'SUBMIT_FAILED': {
            showFailedNotification()
            break
          }
          case 'SUBMIT_STARTED': {
            hideFailedNotification()
            break
          }
          case 'ADDITION': {
            processPendingQueue()
            break
          }
        }
        setState({
          isLoading: false,
          pendingSubmissions,
          loadError: null,
        })
      },
    )
  }, [
    hideFailedNotification,
    isPendingQueueEnabled,
    processPendingQueue,
    reloadPendingSubmissions,
    showFailedNotification,
  ])

  React.useEffect(() => {
    if (!isOffline) {
      processPendingQueue()
    }
  }, [isOffline, processPendingQueue])

  React.useEffect(() => {
    if (submittedNotificationCount > 0) {
      const timeoutId = setTimeout(() => {
        setSubmittedNotificationCount(0)
      }, successNotificationTimeoutMs)
      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [submittedNotificationCount, successNotificationTimeoutMs])

  const value = React.useMemo(
    () => ({
      ...state,
      isShowingFailedNotification,
      hideFailedNotification,
      isProcessingPendingQueue,
      processPendingQueue,
      reloadPendingSubmissions,
      deletePendingSubmission: submissionService.deletePendingQueueSubmission,
      isShowingSuccessNotification: submittedNotificationCount > 0,
    }),
    [
      state,
      isShowingFailedNotification,
      hideFailedNotification,
      isProcessingPendingQueue,
      processPendingQueue,
      reloadPendingSubmissions,
      submittedNotificationCount,
    ],
  )

  return (
    <PendingSubmissionsContext.Provider value={value}>
      {children}
    </PendingSubmissionsContext.Provider>
  )
}

/**
 * React hook to get the context value for Pending Submissions. Will throw an
 * Error if used outside of the `<PendingSubmissionsContextProvider />`
 * component.
 *
 * @returns
 * @group Hooks
 */
export default function usePendingSubmissions(): PendingSubmissionsContextValue {
  const value = React.useContext(PendingSubmissionsContext)
  if (!value) {
    throw new Error(
      `"usePendingSubmissions" hook was used outside of the "<PendingSubmissionsContextProvider />" component's children.`,
    )
  }
  return value
}
