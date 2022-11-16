import * as React from 'react'

import useQuery from './useQuery'

export type ChangeHandler<T> = (filters: T) => T
export type OnChangeFilters<T> = (
  changeHandler: ChangeHandler<T>,
  shouldDebounce: boolean,
) => void

export type LoadingType = 'INITIAL' | 'MORE' | null

export default function useInfiniteScrollDataLoad<Filters, T>({
  limit,
  isManual,
  debounceSearchMs,
  onDefaultFilters,
  onSearch,
  onValidateFilters,
}: {
  limit: number
  isManual?: boolean
  debounceSearchMs?: number
  onDefaultFilters: (query: ReturnType<typeof useQuery>) => Filters
  onSearch: (
    filters: Filters,
    paging: {
      limit: number
      offset: number
    },
    abortSignal: AbortSignal,
  ) => Promise<{
    records: T[]
    meta: {
      limit: number
      offset: number
      nextOffset?: number | undefined
    }
  }>
  onValidateFilters?: (filters: Filters) => boolean
}) {
  const query = useQuery()

  const [{ forceReload, shouldDebounce, offset, filters }, setOffsetState] =
    React.useState<{
      forceReload: boolean
      shouldDebounce: boolean
      offset: number
      filters: Filters
    }>(() => {
      return {
        forceReload: false,
        shouldDebounce: true,
        offset: 0,
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

  const [{ isLoading, records, error, nextOffset }, setState] = React.useState<{
    isLoading: LoadingType
    records: T[]
    error: Error | null
    nextOffset: number
  }>({
    isLoading: 'INITIAL',
    records: [],
    error: null,
    nextOffset: 0,
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
        records: offset === 0 ? [] : currentState.records,
        isLoading: offset === 0 ? 'INITIAL' : 'MORE',
      }))
      try {
        const result = await onSearch(
          filters,
          {
            limit,
            offset,
          },
          abortSignal,
        )
        setState((currentState) => ({
          error: null,
          records: [...currentState.records, ...result.records],
          isLoading: null,
          nextOffset: result.meta.nextOffset || 0,
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
    [onValidateFilters, filters, offset, onSearch, limit],
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

  const onLoad = React.useCallback((newOffset?: number) => {
    setOffsetState((currentState) => {
      return {
        ...currentState,
        offset: typeof newOffset === 'number' ? newOffset : currentState.offset,
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
      if (!document.body || error || isLoading || !nextOffset) {
        return
      }

      // Checks that the page has scrolled to the bottom
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight) {
        onLoad(nextOffset)
      }
    }
    // Binds our scroll event handler
    window.addEventListener('scroll', scrollEventListener)

    return () => {
      window.removeEventListener('scroll', scrollEventListener)
    }
  }, [error, isLoading, isManual, nextOffset, onLoad])

  const onRefresh = React.useCallback(() => {
    onLoad(0)
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
    nextOffset,
  }
}
