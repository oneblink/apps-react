import { IconButton, TextField, TextFieldProps } from '@mui/material'
import {
  MobileDatePicker,
  DateValidationError,
  DateTimeValidationError,
  CalendarIcon,
  MobileDateTimePicker,
  PickersActionBarAction,
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
export const FiltersDatePicker = (props: DatePickersProps) => {
  const { label, onChange } = props
  const commonProps = useCommonPickerProps(props)

  return (
    <MobileDatePicker
      label={label}
      format={shortDateFormat}
      {...commonProps}
      onAccept={(newDate) => {
        if (!newDate) return onChange(undefined)

        const formattedDate = format(newDate, 'yyyy-MM-dd')
        onChange(formattedDate)
      }}
    />
  )
}

type DateTimePickersProps = DatePickersProps & {
  renderHelperText: (errorType: DateTimeValidationError) => void
}
export const FiltersDateTimePicker = (props: DateTimePickersProps) => {
  const { label, onChange } = props
  const commonProps = useCommonPickerProps(props)

  return (
    <MobileDateTimePicker
      label={label}
      format={shortDateTimeFormat}
      {...commonProps}
      onAccept={(newDate) => {
        if (!newDate) return onChange(undefined)
        onChange(newDate.toISOString())
      }}
    />
  )
}

const useCommonPickerProps = <T,>({
  renderHelperText,
  value,
  maxDate,
  minDate,
}: {
  renderHelperText: (errorType: T | null) => void
  value: string | undefined
  maxDate?: string
  minDate?: string
}) => {
  const [errorType, setErrorType] = useNullableState<T>(null)

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

  return {
    slots: {
      textField: (params: React.PropsWithChildren<TextFieldProps>) => (
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
    },
    slotProps: {
      actionBar: {
        actions: [
          'clear',
          'today',
          'cancel',
          'accept',
        ] as PickersActionBarAction[],
      },
    },
    maxDate: maxDateMemo,
    minDate: minDateMemo,
    value: valueMemo,
    onError: setErrorType,
  }
}
