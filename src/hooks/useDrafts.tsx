import * as React from 'react'
import { draftService, submissionService } from '@oneblink/apps'
import { SubmissionTypes } from '@oneblink/types'
import useAuth from './useAuth'
import useIsMounted from './useIsMounted'
import useIsOffline from './useIsOffline'

/** The value returned from `useDrafts()` hook */
export type DraftsContextValue = {
  /** `true` drafts are currently loading. */
  isLoading: boolean
  /** An Error object if loading drafts fails */
  loadError: Error | null
  /** The incomplete submissions that were saved for later */
  drafts: SubmissionTypes.FormsAppDraft[]
  /** A function to trigger loading of the drafts */
  reloadDrafts: () => unknown
  /** A function to clear Error object from loading drafts */
  clearLoadError: () => void
  /** `true` drafts are syncing with other devices */
  isSyncing: boolean
  /** A function to trigger syncing of the drafts */
  syncDrafts: () => unknown
  /** An Error object if syncing drafts fails */
  syncError: Error | null
  /** A function to clear Error object from syncing drafts */
  clearSyncError: () => void
  /** A function to remove a draft */
  deleteDraft: (draftId: string) => Promise<void>
}

const defaultLoadState = {
  isLoading: false,
  loadError: null,
  drafts: [],
}

const defaultSyncState = {
  isSyncing: false,
  syncError: null,
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
 * import { DraftsContextProvider } from '@oneblink/apps-react'
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
    isSyncing: boolean
    syncError: Error | null
  }>(defaultSyncState)
  const clearSyncError = React.useCallback(() => {
    setSyncState((currentState) => ({
      ...currentState,
      syncError: null,
    }))
  }, [])
  const syncDrafts = React.useCallback(async () => {
    if (!isDraftsEnabled || !isLoggedIn || isUsingFormsKey) {
      return
    }

    if (isMounted.current) {
      setSyncState({
        isSyncing: true,
        syncError: null,
      })
    }

    let newError = null

    try {
      await draftService.syncDrafts({
        formsAppId,
        throwError: false,
      })
    } catch (error) {
      newError = error as Error
    }

    if (isMounted.current) {
      setSyncState({
        isSyncing: false,
        syncError: newError,
      })
    }
  }, [formsAppId, isDraftsEnabled, isLoggedIn, isMounted, isUsingFormsKey])

  const [loadState, setLoadState] = React.useState<{
    isLoading: boolean
    loadError: Error | null
    drafts: SubmissionTypes.FormsAppDraft[]
  }>(defaultLoadState)
  const clearLoadError = React.useCallback(() => {
    setLoadState((currentState) => ({
      ...currentState,
      loadError: null,
    }))
  }, [])
  const reloadDrafts = React.useCallback(async () => {
    if (!isLoggedIn) {
      if (isMounted.current) {
        setLoadState({
          isLoading: false,
          loadError: null,
          drafts: [],
        })
      }
      return
    }

    if (isMounted.current) {
      setLoadState((currentState) => ({
        isLoading: true,
        loadError: null,
        drafts: currentState.drafts,
      }))
    }

    let newError = null
    let newDrafts: SubmissionTypes.FormsAppDraft[] = []

    try {
      newDrafts = await draftService.getDrafts()
    } catch (error) {
      newError = error as Error
    }

    if (isMounted.current) {
      setLoadState({
        isLoading: false,
        loadError: newError,
        drafts: newDrafts,
      })
    }
  }, [isMounted, isLoggedIn])

  const deleteDraft = React.useCallback(
    (draftId) => {
      return draftService.deleteDraft(draftId, formsAppId)
    },
    [formsAppId],
  )

  const value = React.useMemo(
    () => ({
      // Sync
      syncDrafts,
      isSyncing: syncState.isSyncing,
      syncError: syncState.syncError,
      clearSyncError,
      // Load
      reloadDrafts,
      isLoading: loadState.isLoading,
      drafts: loadState.drafts,
      loadError: loadState.loadError,
      clearLoadError,
      // Delete,
      deleteDraft,
    }),
    [
      clearLoadError,
      clearSyncError,
      loadState.drafts,
      loadState.isLoading,
      loadState.loadError,
      reloadDrafts,
      syncDrafts,
      syncState.isSyncing,
      syncState.syncError,
      deleteDraft,
    ],
  )

  React.useEffect(() => {
    reloadDrafts()
    const unregisterPendingQueueListener =
      submissionService.registerPendingQueueListener(reloadDrafts)
    const unregisterDraftsListener = draftService.registerDraftsListener(
      (drafts) => {
        setLoadState({
          isLoading: false,
          drafts,
          loadError: null,
        })
      },
    )
    return () => {
      unregisterPendingQueueListener()
      unregisterDraftsListener()
    }
  }, [reloadDrafts])

  React.useEffect(() => {
    if (!isOffline) {
      syncDrafts()
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
