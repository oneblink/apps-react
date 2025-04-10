import * as React from 'react'

import useQuery from './useQuery'

export type ChangeHandler<T> = (filters: T) => T
export type OnChangeFilters<T> = (
  changeHandler: ChangeHandler<T>,
  shouldDebounce: boolean,
) => void

export type LoadingType = 'INITIAL' | 'MORE' | null

export default function useInfiniteScrollDataLoad<Filters, Paging, T>({
  initialPaging,
  isManual,
  debounceSearchMs,
  onDefaultFilters,
  onSearch,
  onValidateFilters,
}: {
  initialPaging?: Paging
  isManual?: boolean
  debounceSearchMs?: number
  onDefaultFilters: (query: ReturnType<typeof useQuery>) => Filters
  onSearch: (
    filters: Filters,
    paging: Paging | undefined,
    abortSignal: AbortSignal,
  ) => Promise<{
    records: T[]
    paging: Paging | undefined
  }>
  onValidateFilters?: (filters: Filters) => boolean
}) {
  const query = useQuery()

  const [{ forceReload, shouldDebounce, paging, filters }, setOffsetState] =
    React.useState<{
      forceReload: boolean
      shouldDebounce: boolean
      paging: Paging | undefined
      filters: Filters
    }>(() => {
      return {
        forceReload: false,
        shouldDebounce: false,
        paging: initialPaging,
        filters: onDefaultFilters(query),
      }
    })

  const onChangeFilters = React.useCallback<OnChangeFilters<Filters>>(
    (changeHandler, shouldDebounce) => {
      setOffsetState((currentState) => ({
        ...currentState,
        afterRefresh: false,
        shouldDebounce,
        offset: 0,
        filters: changeHandler(currentState.filters),
      }))
    },
    [],
  )

  const [{ isLoading, records, error }, setState] = React.useState<{
    isLoading: LoadingType
    records: T[]
    error: Error | null
  }>({
    isLoading: 'INITIAL',
    records: [],
    error: null,
  })

  const fetchRecords = React.useCallback(
    async (abortSignal: AbortSignal) => {
      if (onValidateFilters) {
        const isValid = onValidateFilters(filters)
        if (!isValid) {
          return
        }
      }

      setState((currentState) => ({
        ...currentState,
        error: null,
        records: paging === undefined ? [] : currentState.records,
        isLoading: paging === undefined ? 'INITIAL' : 'MORE',
      }))
      try {
        const result = await onSearch(filters, paging, abortSignal)
        setState((currentState) => ({
          error: null,
          records: [...currentState.records, ...result.records],
          isLoading: null,
          paging: result.paging,
        }))
      } catch (error) {
        if (abortSignal.aborted) {
          return
        }
        console.warn('An error occurred while fetching records', error)
        setState((currentState) => ({
          ...currentState,
          error: error as Error,
          isLoading: null,
        }))
      }
    },
    [onValidateFilters, filters, onSearch, paging],
  )

  React.useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => {
        fetchRecords(controller.signal)
      },
      shouldDebounce ? debounceSearchMs || 0 : 0,
    )
    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [debounceSearchMs, fetchRecords, shouldDebounce, forceReload])

  const onLoad = React.useCallback((newPaging?: Paging) => {
    setOffsetState((currentState) => {
      return {
        ...currentState,
        offset: newPaging !== undefined ? newPaging : currentState.paging,
        forceReload: !currentState.forceReload,
        shouldDebounce: false,
      }
    })
  }, [])

  React.useEffect(() => {
    if (isManual) {
      return
    }
    const scrollEventListener = () => {
      // Bails early if we have not fetched data yet and:
      // - there's an error
      // - it's already loading
      // - there's nothing left to load
      if (!document.body || error || isLoading || !paging) {
        return
      }

      // Checks that the page has scrolled to the bottom
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
        onLoad(paging)
      }
    }
    // Binds our scroll event handler
    window.addEventListener('scroll', scrollEventListener)

    return () => {
      window.removeEventListener('scroll', scrollEventListener)
    }
  }, [error, isLoading, isManual, onLoad, paging])

  const onRefresh = React.useCallback(() => {
    onLoad(undefined)
  }, [onLoad])

  const onReplace = React.useCallback((replacer: (record: T) => T) => {
    setState((state) => ({
      ...state,
      records: state.records.map(replacer),
    }))
  }, [])

  return {
    isLoading,
    loadError: error,
    records,
    onRefresh,
    onTryAgain: onLoad,
    filters,
    onChangeFilters,
    onReplace,
    paging,
  }
}
