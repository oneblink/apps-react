import React, {
  useContext,
  createContext,
  useMemo,
  useCallback,
  ComponentProps,
} from 'react'
import { NylasScheduling } from '@nylas/react'
import { Snackbar, Alert, Button, useTheme } from '@mui/material'
import Color from 'color'
import useBooleanState from '../../hooks/useBooleanState'

type CalendarBookingsContextProps = {
  setBookingError: (errorString: string) => void
  onTimeSlotConfirmed: () => Promise<void>
  themeConfig: ComponentProps<typeof NylasScheduling>['themeConfig']
}

const CalendarBookingsContext = createContext<CalendarBookingsContextProps>({
  setBookingError: () => {},
  onTimeSlotConfirmed: async () => {},
  themeConfig: {},
})

export function CalendarBookingsProvider({
  children,
  refreshNylasState,
}: {
  children: React.ReactNode
  refreshNylasState: () => void
}) {
  const [isShowingErrorSnack, showErrorSnack, hideErrorSnack] =
    useBooleanState(false)
  const [bookingError, _setBookingError] = React.useState<string>()

  const setBookingError = useCallback(
    (errorString: string) => {
      _setBookingError(errorString)
      showErrorSnack()
    },
    [showErrorSnack],
  )

  /**
   * The alternative here is to set the submissionId field to multi-line-text
   * input then use the below css It works because the booking form only has 1
   * multi-line-text input Unfortunately chrome won't allow :nth-child selectors
   * on part() selectors ::part(nbf__textarea-component) { display: none; }
   */
  const onTimeSlotConfirmed = React.useCallback(async () => {
    setTimeout(() => {
      const submissionIdInputComponent = document
        .querySelector('nylas-scheduling')
        ?.shadowRoot?.querySelector('nylas-booking-form')
        ?.shadowRoot?.querySelector('#submissionId') as HTMLElement | undefined

      if (submissionIdInputComponent) {
        submissionIdInputComponent.style.display = 'none'
      }
    }, 50)
  }, [])

  const theme = useTheme()

  const colorIsLight = useMemo(
    () => Color(theme.palette.primary.main).isLight(),
    [theme.palette.primary.main],
  )

  const themeConfig = useMemo(() => {
    const nylasTheme: ComponentProps<typeof NylasScheduling>['themeConfig'] = {
      '--nylas-info': theme.palette.info.main,
      '--nylas-success': theme.palette.success.main,
      '--nylas-warning': theme.palette.warning.main,
      '--nylas-error': theme.palette.error.main,
      '--nylas-font-family': theme.typography.fontFamily,
      '--nylas-font-size': theme.typography.fontSize.toString(),
    }

    if (!colorIsLight) {
      nylasTheme['--nylas-primary'] = theme.palette.primary.main
    }
    return nylasTheme
  }, [theme.palette, colorIsLight, theme.typography])

  const value = useMemo(
    () => ({
      setBookingError,
      onTimeSlotConfirmed,
      themeConfig,
    }),
    [setBookingError, onTimeSlotConfirmed, themeConfig],
  )

  return (
    <CalendarBookingsContext.Provider value={value}>
      <>
        {children}
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          open={isShowingErrorSnack}
        >
          <Alert
            onClose={hideErrorSnack}
            severity={'error'}
            elevation={6}
            variant="filled"
            action={
              <Button
                color="inherit"
                variant="text"
                size="small"
                onClick={refreshNylasState}
              >
                <b>Start Again</b>
              </Button>
            }
          >
            {bookingError}
          </Alert>
        </Snackbar>
      </>
    </CalendarBookingsContext.Provider>
  )
}

export default function useCalendarBookings() {
  return useContext(CalendarBookingsContext)
}
