import React from 'react'
import { NylasScheduling } from '@nylas/react'
import { schedulingService } from '@oneblink/apps'
import ErrorMessage from '../messages/ErrorMessage'
import CalendarBookingsPage from './CalendarBookingsContainer'
import useCalendarBookings from './CalendarBookingsProvider'

function NylasCancelForm({
  sessionId,
  bookingRef,
}: Awaited<
  ReturnType<typeof schedulingService.createNylasExistingBookingSession>
> & {
  submissionId: string
}) {
  const { setBookingError, themeConfig } = useCalendarBookings()

  if (!bookingRef) {
    return (
      <ErrorMessage title="Error Retrieving Data" gutterTop>
        <span className="cypress-booking-ref-not-found-error-message">
          Could not find a calendar booking to cancel
        </span>
      </ErrorMessage>
    )
  }

  return (
    <div className="ob-scheduling-booking-form">
      <NylasScheduling
        sessionId={sessionId}
        eventOverrides={{
          bookedEventInfo: async (event) => {
            event.preventDefault()
            if (event.detail.error) {
              setBookingError(
                event.detail.error.message ?? 'Calendar Booking Error',
              )
            }
          },
        }}
        themeConfig={themeConfig}
        cancelBookingRef={bookingRef}
        enableUserFeedback={false}
        nylasBranding={false}
      />
    </div>
  )
}

function CalendarBookingsCancelForm() {
  return (
    <CalendarBookingsPage
      fetchConfiguration={schedulingService.createNylasExistingBookingSession}
    >
      {(props) => <NylasCancelForm {...props} />}
    </CalendarBookingsPage>
  )
}

export default React.memo(CalendarBookingsCancelForm)
