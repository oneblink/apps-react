import * as React from 'react'
import { draftService, submissionService } from '@oneblink/apps'
import useAuth from './useAuth'
import useIsMounted from './useIsMounted'
import useIsOffline from './useIsOffline'

/** The value returned from `useDrafts()` hook */
export type DraftsContextValue = {
  /** `true` if drafts are currently loading for the first time. */
  isLoading: boolean
  /** The incomplete submissions that were saved for later */
  drafts: draftService.LocalFormSubmissionDraft[]
  /** `true` drafts are syncing with other devices */
  isSyncing: boolean
  /**
   * The date when the sync process last completed successfully, will be `null`
   * until it has completed the first time.
   */
  lastSyncTime: Date | null
  /** A function to trigger syncing of the drafts */
  syncDrafts: (abortSignal: AbortSignal | undefined) => Promise<void>
  /** An Error object if syncing drafts fails */
  syncError: Error | null
  /** A function to clear Error object from syncing drafts */
  clearSyncError: () => void
  /** A function to remove a draft */
  deleteDraft: (formSubmissionDraftId: string) => Promise<void>
}

const DraftsContext = React.createContext<DraftsContextValue | undefined>(
  undefined,
)

/**
 * React Component that provides the context for the `useDrafts()` hook to be
 * used by components further down your component tree. **It should only be
 * included in your component tree once and ideally at the root of the
 * application.**
 *
 * #### Example
 *
 * ```jsx
 * import * as React from 'react'
 * import { DraftsContextProvider, useDrafts } from '@oneblink/apps-react'
 *
 * function Component() {
 *   const draftsContext = useDrafts()
 *   // use drafts here
 * }
 *
 * function App() {
 *   return (
 *     <DraftsContextProvider>
 *       <Component />
 *     </DraftsContextProvider>
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
export function DraftsContextProvider({
  /** The identifier for the forms app associated with the user's drafts */
  formsAppId,
  /**
   * `true` if drafts are enabled, otherwise `false`. Can be used for account
   * tier validation.
   */
  isDraftsEnabled,
  /** Your application components */
  children,
}: {
  formsAppId: number
  isDraftsEnabled: boolean
  children: React.ReactNode
}) {
  const isMounted = useIsMounted()
  const isOffline = useIsOffline()
  const { isLoggedIn, isUsingFormsKey } = useAuth()

  const [syncState, setSyncState] = React.useState<{
    lastSyncTime: Date | null
    isSyncing: boolean
    syncError: Error | null
  }>({
    lastSyncTime: null,
    isSyncing: false,
    syncError: null,
  })
  const clearSyncError = React.useCallback(() => {
    setSyncState((currentState) => ({
      ...currentState,
      syncError: null,
    }))
  }, [])
  const syncDrafts = React.useCallback(
    async (abortSignal: AbortSignal | undefined) => {
      if (!isDraftsEnabled || !isLoggedIn || isUsingFormsKey) {
        return
      }

      if (isMounted.current) {
        setSyncState((currentState) => ({
          ...currentState,
          isSyncing: true,
          syncError: null,
        }))
      }

      let newError = null

      try {
        await draftService.syncDrafts({
          formsAppId,
          throwError: true,
          abortSignal,
        })
      } catch (error) {
        newError = error as Error
      }

      if (isMounted.current) {
        setSyncState({
          lastSyncTime: new Date(),
          isSyncing: false,
          syncError: newError,
        })
      }
    },
    [formsAppId, isDraftsEnabled, isLoggedIn, isMounted, isUsingFormsKey],
  )

  const [drafts, setDrafts] = React.useState<
    draftService.LocalFormSubmissionDraft[] | null
  >(null)

  const deleteDraft = React.useCallback(
    (draftId) => {
      return draftService.deleteDraft(draftId, formsAppId)
    },
    [formsAppId],
  )

  const value = React.useMemo<DraftsContextValue>(
    () => ({
      // Sync
      syncDrafts,
      isSyncing: syncState.isSyncing,
      syncError: syncState.syncError,
      lastSyncTime: syncState.lastSyncTime,
      clearSyncError,
      // Load
      isLoading: !drafts,
      drafts: drafts || [],
      // Delete,
      deleteDraft,
    }),
    [
      syncDrafts,
      syncState.isSyncing,
      syncState.syncError,
      syncState.lastSyncTime,
      clearSyncError,
      drafts,
      deleteDraft,
    ],
  )

  React.useEffect(() => {
    const abortController = new AbortController()
    const unregisterPendingQueueListener =
      submissionService.registerPendingQueueListener(() =>
        syncDrafts(undefined),
      )
    const unregisterDraftsListener =
      draftService.registerDraftsListener(setDrafts)
    return () => {
      abortController.abort()
      unregisterPendingQueueListener()
      unregisterDraftsListener()
    }
  }, [syncDrafts])

  React.useEffect(() => {
    if (!isOffline) {
      const abortController = new AbortController()
      syncDrafts(abortController.signal)
      return () => {
        abortController.abort()
      }
    }
  }, [isOffline, syncDrafts])

  return (
    <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>
  )
}

/**
 * React hook to get the context value for Drafts. Will throw an Error if used
 * outside of the `<DraftsContextProvider />` component.
 *
 * @returns
 * @group Hooks
 */
export default function useDrafts(): DraftsContextValue {
  const value = React.useContext(DraftsContext)
  if (!value) {
    throw new Error(
      `"useDrafts" hook was used outside of the "<DraftsContextProvider />" component's children.`,
    )
  }
  return value
}
