import * as React from 'react'
import { PickersActionBarAction } from '@mui/x-date-pickers'
import clsx from 'clsx'
import MaterialIcon from '../../components/MaterialIcon'

export default function useFormDatePickerProps({
  id,
  value,
  maxDate,
  minDate,
  icon,
  ariaDescribedby,
  autocompleteAttributes,
  placeholder,
  className,
  onBlur,
  onChange,
}: {
  id: string
  value: string | undefined
  maxDate: string | undefined
  minDate: string | undefined
  icon: 'event' | 'date_range' | 'schedule'
  ariaDescribedby: string | undefined
  autocompleteAttributes: string | undefined
  placeholder: string | undefined
  className: string
  onBlur: () => void
  onChange: (newDate: Date | undefined) => void
}) {
  const valueMemo = React.useMemo(() => {
    return value ? new Date(value) : null
  }, [value])

  const maxDateMemo = React.useMemo(
    () => (maxDate ? new Date(maxDate) : undefined),
    [maxDate],
  )
  const minDateMemo = React.useMemo(
    () => (minDate ? new Date(minDate) : undefined),
    [minDate],
  )

  //must be a function
  const openPickerIcon = React.useCallback(
    () => <MaterialIcon className="is-size-5">{icon}</MaterialIcon>,
    [icon],
  )

  const formDatePickerProps = React.useMemo(
    () => ({
      slots: {
        openPickerIcon,
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
        popper: { disablePortal: true },
        textField: {
          id,
          fullWidth: true,
          label: undefined,
          margin: 'dense' as const,
          size: 'small' as const,
          placeholder: placeholder,
          autoComplete: autocompleteAttributes,
          'aria-describedby': ariaDescribedby,
          onBlur,
          //we have our own error and helper text state
          error: false,
          inputProps: {
            className: clsx('input ob-input', className),
          },
          sx: {
            '& .MuiOutlinedInput-root': {
              fontFamily: 'inherit',
              '& fieldset': {
                borderColor: '#dbdbdb',
              },
              '&:hover fieldset': {
                borderColor: '#b5b5b5',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#485fc7',
                borderWidth: '1px',
              },
            },
          },
        },
      },
      onClose: onBlur,
      onChange: (newDate: Date | null) => {
        if (!(newDate instanceof Date) || isNaN(newDate.valueOf())) {
          onChange(undefined)
        } else {
          onChange(newDate)
        }
      },
      maxDate: maxDateMemo,
      minDate: minDateMemo,
      value: valueMemo,
    }),
    [
      ariaDescribedby,
      className,
      id,
      maxDateMemo,
      minDateMemo,
      onBlur,
      onChange,
      openPickerIcon,
      placeholder,
      valueMemo,
      autocompleteAttributes,
    ],
  )

  return formDatePickerProps
}
