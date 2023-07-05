import { IconButton, TextField } from '@mui/material'
import {
  MobileDatePicker,
  DateValidationError,
  DateTimeValidationError,
  CalendarIcon,
  MobileDateTimePicker,
} from '@mui/x-date-pickers'
import * as React from 'react'
import useNullableState from '../../../hooks/useNullableState'
import { format } from 'date-fns'
import { localisationService } from '@oneblink/apps'

const shortDateFormat = localisationService.getDateFnsFormats().shortDate
const shortDateTimeFormat =
  localisationService.getDateFnsFormats().shortDateTime

type DatePickersProps = {
  label: string
  value: string | undefined
  onChange: (newDate: string | undefined) => void
  renderHelperText: (errorType: DateValidationError) => void
  maxDate?: string
  minDate?: string
}
export const FiltersDatePicker = ({
  label,
  value,
  onChange,
  renderHelperText,
  maxDate,
  minDate,
}: DatePickersProps) => {
  const [errorType, setErrorType] = useNullableState<DateValidationError>(null)

  const valueMemo = React.useMemo(() => {
    return value ? new Date(value) : null
  }, [value])

  const maxDateMemo = React.useMemo(
    () => (maxDate ? new Date(maxDate) : null),
    [maxDate],
  )
  const minDateMemo = React.useMemo(
    () => (minDate ? new Date(minDate) : null),
    [minDate],
  )

  return (
    <MobileDatePicker
      label={label}
      format={shortDateFormat}
      slots={{
        textField: (params) => (
          <TextField
            {...params}
            variant="outlined"
            margin="dense"
            size="small"
            helperText={renderHelperText(errorType)}
            InputProps={{
              endAdornment: (
                <IconButton edge="end">
                  <CalendarIcon />
                </IconButton>
              ),
            }}
          />
        ),
      }}
      slotProps={{
        actionBar: {
          actions: ['clear', 'today', 'cancel', 'accept'],
        },
      }}
      maxDate={maxDateMemo}
      minDate={minDateMemo}
      value={valueMemo}
      onAccept={(newDate) => {
        if (!newDate) return onChange(undefined)

        const formattedDate = format(newDate, 'yyyy-MM-dd')
        onChange(formattedDate)
      }}
      onError={setErrorType}
    />
  )
}

type DateTimePickersProps = DatePickersProps & {
  renderHelperText: (errorType: DateTimeValidationError) => void
}
export const FiltersDateTimePicker = ({
  label,
  onChange,
  renderHelperText,
  value,
  maxDate,
  minDate,
}: DateTimePickersProps) => {
  const [errorType, setErrorType] =
    useNullableState<DateTimeValidationError>(null)

  const valueMemo = React.useMemo(() => {
    return value ? new Date(value) : null
  }, [value])

  const maxDateMemo = React.useMemo(
    () => (maxDate ? new Date(maxDate) : null),
    [maxDate],
  )
  const minDateMemo = React.useMemo(
    () => (minDate ? new Date(minDate) : null),
    [minDate],
  )

  return (
    <MobileDateTimePicker
      label={label}
      format={shortDateTimeFormat}
      slots={{
        textField: (params) => (
          <TextField
            {...params}
            variant="outlined"
            margin="dense"
            size="small"
            helperText={renderHelperText(errorType)}
            InputProps={{
              endAdornment: (
                <IconButton edge="end">
                  <CalendarIcon />
                </IconButton>
              ),
            }}
          />
        ),
      }}
      slotProps={{
        actionBar: {
          actions: ['clear', 'today', 'cancel', 'accept'],
        },
      }}
      maxDate={maxDateMemo}
      minDate={minDateMemo}
      value={valueMemo}
      onAccept={(newDate) => {
        if (!newDate) return onChange(undefined)
        onChange(newDate.toISOString())
      }}
      onError={setErrorType}
    />
  )
}
