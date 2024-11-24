import React from 'react'
import useQuery from '../../hooks/useQuery'
import useLoadDataState from '../../hooks/useLoadDataState'
import ErrorMessage from '../messages/ErrorMessage'
import { CalendarBookingsProvider } from './CalendarBookingsProvider'
import OnLoading from '../renderer/OnLoading'
import ErrorModal from './ErrorModal'

type FetchConfiguration<T> = (
  submissionId: string,
  abortSignal: AbortSignal,
) => Promise<T>

function CalendarBookingLoader<T>({
  submissionId,
  fetchConfiguration,
  children,
}: {
  submissionId: string
  fetchConfiguration: FetchConfiguration<T>
  children: (renderProps: { submissionId: string } & T) => React.ReactNode
}) {
  const [nylasSchedulingState, refreshNylasState] = useLoadDataState<T>(
    React.useCallback(
      async (abortSignal) => {
        return await fetchConfiguration(submissionId, abortSignal)
      },
      [fetchConfiguration, submissionId],
    ),
  )

  if (nylasSchedulingState.status === 'LOADING') {
    return (
      <div className="has-margin-top-1">
        <div className="cypress-loading has-text-centered">
          <OnLoading className="has-text-centered" />
        </div>
      </div>
    )
  }

  if (nylasSchedulingState.status === 'ERROR') {
    return (
      <ErrorModal
        error={nylasSchedulingState.error}
        onClose={refreshNylasState}
      />
    )
  }

  return (
    <CalendarBookingsProvider refreshNylasState={refreshNylasState}>
      {children({
        ...nylasSchedulingState.result,
        submissionId,
      })}
    </CalendarBookingsProvider>
  )
}

export default function CalendarBookingsContainer<T>({
  fetchConfiguration,
  children,
}: {
  fetchConfiguration: (
    submissionId: string,
    abortSignal: AbortSignal,
  ) => Promise<T>
  children: (renderProps: { submissionId: string } & T) => React.ReactNode
}) {
  const { submissionId: submissionIdQs } = useQuery()

  const submissionId = React.useMemo(
    () => (typeof submissionIdQs === 'string' ? submissionIdQs : undefined),
    [submissionIdQs],
  )

  if (!submissionId) {
    return (
      <ErrorMessage title="Missing Configuration" gutterTop>
        <span className="cypress-scheduling-booking-form-invalid-querystring ob-scheduling-booking-form__invalid-querystring-message">
          It seems you have navigated here incorrectly. Please go back.
        </span>
      </ErrorMessage>
    )
  }

  return (
    <CalendarBookingLoader
      fetchConfiguration={fetchConfiguration}
      submissionId={submissionId}
    >
      {children}
    </CalendarBookingLoader>
  )
}
