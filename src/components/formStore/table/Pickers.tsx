import {
  MobileDatePicker,
  DateValidationError,
  DateTimeValidationError,
  MobileDateTimePicker,
  PickersActionBarAction,
} from '@mui/x-date-pickers'
import * as React from 'react'
import useNullableState from '../../../hooks/useNullableState'
import { format } from 'date-fns'
import { localisationService } from '../../../apps'

const shortDateFormat = localisationService.getDateFnsFormats().shortDate
const shortDateTimeFormat =
  localisationService.getDateFnsFormats().shortDateTime

type DatePickersProps = {
  label: string
  value: string | undefined
  onChange: (newDate: string | undefined) => void
  renderHelperText: (errorType: DateValidationError) => React.ReactNode
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
  renderHelperText: (errorType: DateTimeValidationError) => React.ReactNode
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

const useCommonPickerProps = <T extends DateTimeValidationError>({
  renderHelperText,
  value,
  maxDate,
  minDate,
}: {
  renderHelperText: (errorType: T | null) => React.ReactNode
  value: string | undefined
  maxDate?: string
  minDate?: string
}) => {
  const [errorType, setErrorType] = useNullableState<T>(null)

  const valueMemo = React.useMemo(() => {
    return value ? new Date(value) : undefined
  }, [value])

  const maxDateMemo = React.useMemo(
    () => (maxDate ? new Date(maxDate) : undefined),
    [maxDate],
  )
  const minDateMemo = React.useMemo(
    () => (minDate ? new Date(minDate) : undefined),
    [minDate],
  )

  return {
    slotProps: {
      textField: {
        variant: 'outlined' as const,
        margin: 'dense' as const,
        size: 'small' as const,
        helperText: renderHelperText(errorType),
      },
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
    enableAccessibleFieldDOMStructure: false,
  }
}
