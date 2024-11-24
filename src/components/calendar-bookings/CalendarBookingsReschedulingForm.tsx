import React from 'react'
import { NylasScheduling } from '@nylas/react'
import { schedulingService } from '@oneblink/apps'
import ErrorMessage from '../messages/ErrorMessage'
import CalendarBookingsContainer from './CalendarBookingsContainer'
import useCalendarBookings from './CalendarBookingsProvider'

function NylasReschedulingForm({
  submissionId,
  name,
  email,
  sessionId,
  bookingRef,
}: Awaited<
  ReturnType<typeof schedulingService.createNylasExistingBookingSession>
> & {
  submissionId: string
}) {
  const { setBookingError, onTimeSlotConfirmed, themeConfig } =
    useCalendarBookings()

  if (!bookingRef) {
    return (
      <ErrorMessage title="Error Retrieving Data" gutterTop>
        <span className="cypress-booking-ref-not-found-error-message">
          Could not find a calendar booking to reschedule
        </span>
      </ErrorMessage>
    )
  }

  return (
    <div className="ob-scheduling-booking-form">
      <NylasScheduling
        sessionId={sessionId}
        eventOverrides={{
          timeslotConfirmed: onTimeSlotConfirmed,
          bookedEventInfo: async (event) => {
            event.preventDefault()
            if (event.detail.error) {
              setBookingError(
                event.detail.error.message ?? 'Calendar Booking Error',
              )
            }
          },
        }}
        bookingInfo={{
          primaryParticipant: {
            name: name ?? '',
            email: email ?? '',
          },
          additionalFields: {
            submissionId: { value: submissionId, type: 'text' },
          },
        }}
        themeConfig={themeConfig}
        enableUserFeedback={false}
        rescheduleBookingRef={bookingRef}
        nylasBranding={false}
      />
    </div>
  )
}

function ReschedulingForm() {
  return (
    <CalendarBookingsContainer
      fetchConfiguration={schedulingService.createNylasExistingBookingSession}
    >
      {(props) => <NylasReschedulingForm {...props} />}
    </CalendarBookingsContainer>
  )
}

export default React.memo(ReschedulingForm)
