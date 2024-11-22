import * as React from 'react'
import { NylasScheduling } from '@nylas/react'
import { Collapse, Fade } from '@mui/material'
import {
  schedulingService,
  submissionService,
  OneBlinkAppsError,
} from '@oneblink/apps'
import clsx from 'clsx'
import { Receipt } from '../receipts'
import ErrorModal from './ErrorModal'
import OnLoading from '../renderer/OnLoading'
import CalendarBookingsPage from './CalendarBookingsContainer'
import useCalendarBookings from './CalendarBookingsProvider'

function NylasBookingForm({
  submissionId,
  name,
  email,
  configurationId,
  sessionId,
  onBookingConfirmed,
  postSubmissionAction,
}: Awaited<
  ReturnType<typeof schedulingService.createNylasNewBookingSession>
> & {
  submissionId: string
  postSubmissionAction: (
    formSubmissionResult: submissionService.FormSubmissionResult,
  ) => void
}) {
  const { setBookingError, onTimeSlotConfirmed } = useCalendarBookings()

  const [
    {
      formSubmissionResult,
      isRunningPostSubmissionAction,
      postSubmissionError,
      isConfirmingBooking,
      confirmingBookingError,
    },
    setPostSubmissionState,
  ] = React.useState<{
    formSubmissionResult: submissionService.FormSubmissionResult | null
    isRunningPostSubmissionAction: boolean
    postSubmissionError: OneBlinkAppsError | null
    isConfirmingBooking: boolean
    confirmingBookingError: OneBlinkAppsError | null
  }>({
    formSubmissionResult: null,
    isRunningPostSubmissionAction: false,
    postSubmissionError: null,
    isConfirmingBooking: false,
    confirmingBookingError: null,
  })
  const clearPostSubmissionError = React.useCallback(() => {
    setPostSubmissionState((currentState) => ({
      ...currentState,
      postSubmissionError: null,
    }))
  }, [])
  const clearConfirmingBookingError = React.useCallback(() => {
    setPostSubmissionState((currentState) => ({
      ...currentState,
      confirmingBookingError: null,
    }))
  }, [])

  const handleConfirmedBooking = React.useCallback(async () => {
    setPostSubmissionState((currentState) => ({
      ...currentState,
      isConfirmingBooking: true,
      confirmingBookingError: null,
    }))

    try {
      const formSubmissionResult = await onBookingConfirmed()
      setPostSubmissionState((currentState) => ({
        ...currentState,
        formSubmissionResult,
      }))
      if (formSubmissionResult.payment) {
        setTimeout(() => {
          postSubmissionAction(formSubmissionResult)
        }, 2000)
      } else {
        setPostSubmissionState((currentState) => ({
          ...currentState,
          isConfirmingBooking: false,
          formSubmissionResult,
        }))
      }
    } catch (error) {
      console.warn('Error while handling confirmed booking', error)
      setPostSubmissionState((currentState) => ({
        ...currentState,
        isConfirmingBooking: false,
        confirmingBookingError: error as OneBlinkAppsError,
      }))
    }
  }, [postSubmissionAction, onBookingConfirmed])

  return (
    <>
      <Collapse in={isConfirmingBooking}>
        <div className="has-margin-top-1">
          <div className="cypress-loading has-text-centered">
            <OnLoading className="has-text-centered" />
            <Fade in={!!formSubmissionResult?.payment}>
              <span>Redirecting to payment</span>
            </Fade>
          </div>
        </div>
      </Collapse>

      <div className="ob-scheduling-booking-form">
        {!formSubmissionResult?.payment && (
          <NylasScheduling
            eventOverrides={{
              timeslotConfirmed: onTimeSlotConfirmed,
              bookedEventInfo: async (event) => {
                event.preventDefault()

                if (event.detail.error) {
                  setBookingError(
                    event.detail.error.message ?? 'Calendar Booking Error',
                  )
                } else {
                  event.detail
                  await handleConfirmedBooking()
                }
              },
            }}
            bookingInfo={{
              primaryParticipant: {
                name: name ?? '',
                email: email ?? '',
              },
              additionalFields: {
                submissionId: {
                  value: submissionId,
                  type: 'text',
                },
              },
            }}
            enableUserFeedback={false}
            configurationId={configurationId}
            sessionId={sessionId}
            nylasBranding={false}
          />
        )}

        {formSubmissionResult && !formSubmissionResult.payment && (
          <Receipt
            className="ob-scheduling-receipt"
            containerClassName="ob-scheduling-receipt__container"
          >
            <div className="buttons">
              <button
                type="button"
                className={clsx(
                  'is-primary button ob-button ob-scheduling-receipt__button ob-scheduling-receipt__okay-button cypress-scheduling-receipt-okay-button',
                  { 'is-loading': isRunningPostSubmissionAction },
                )}
                disabled={isRunningPostSubmissionAction}
                onClick={() => postSubmissionAction(formSubmissionResult)}
              >
                Done
              </button>
            </div>
          </Receipt>
        )}

        <ErrorModal
          error={postSubmissionError}
          onClose={clearPostSubmissionError}
        />

        <ErrorModal
          error={confirmingBookingError}
          onClose={clearConfirmingBookingError}
        />
      </div>
    </>
  )
}

function CalendarBookingsForm({
  postSubmissionAction,
}: {
  postSubmissionAction: (
    formSubmissionResult: submissionService.FormSubmissionResult,
  ) => void
}) {
  return (
    <CalendarBookingsPage
      fetchConfiguration={schedulingService.createNylasNewBookingSession}
    >
      {(props) => (
        <NylasBookingForm
          {...props}
          postSubmissionAction={postSubmissionAction}
        />
      )}
    </CalendarBookingsPage>
  )
}

export default React.memo(CalendarBookingsForm)
