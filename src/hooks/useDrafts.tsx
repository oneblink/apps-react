import * as React from 'react'
import { draftService, submissionService } from '@oneblink/apps'
import { SubmissionTypes } from '@oneblink/types'
import useAuth from './useAuth'
import useIsMounted from './useIsMounted'
import useIsOffline from './useIsOffline'
export type DraftsContextValue = {
  // Load
  isLoading: boolean
  loadError: Error | null
  drafts: SubmissionTypes.FormsAppDraft[]
  reloadDrafts: () => unknown
  clearLoadError: () => void
  // Sync
  isSyncing: boolean
  syncDrafts: () => unknown
  syncError: Error | null
  clearSyncError: () => void
  // Delete
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

const DraftsContext = React.createContext<DraftsContextValue>({
  ...defaultLoadState,
  ...defaultSyncState,
  reloadDrafts: () => {},
  clearLoadError: () => {},
  syncDrafts: () => {},
  clearSyncError: () => {},
  deleteDraft: async () => {},
})

export function DraftsContextProvider({
  formsAppId,
  isDraftsEnabled,
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

export default function useDrafts() {
  return React.useContext(DraftsContext)
}
