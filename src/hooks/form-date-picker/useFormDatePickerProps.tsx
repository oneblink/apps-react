import * as React from 'react'
import { TextField, TextFieldProps, styled } from '@mui/material'
import { PickersActionBarAction } from '@mui/x-date-pickers'
import clsx from 'clsx'
import MaterialIcon from '../../components/MaterialIcon'

const StyledTextField = styled(TextField)(() => ({
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
}))

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const textField = React.useCallback(
    (params: React.PropsWithChildren<TextFieldProps>) => (
      <StyledTextField
        {...params}
        id={id}
        variant="outlined"
        margin="dense"
        size="small"
        label={undefined}
        placeholder={placeholder}
        autoComplete={autocompleteAttributes}
        aria-describedby={ariaDescribedby}
        inputProps={{
          ...params.inputProps,
          className: clsx(
            params.inputProps?.className,
            'input ob-input',
            className,
          ),
        }}
        fullWidth
        onBlur={(e) => {
          //need to run the blur function being passed from the picker
          params?.onBlur?.(e)
          onBlur()
        }}
        //we have our own error and helper text state
        error={undefined}
      />
    ),
    [
      ariaDescribedby,
      autocompleteAttributes,
      className,
      id,
      onBlur,
      placeholder,
    ],
  )

  return {
    slots: {
      textField,
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
  }
}
