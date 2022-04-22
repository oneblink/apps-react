import * as React from 'react'
import { MobileDatePicker, MobileDatePickerProps } from '@mui/x-date-pickers'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { DateRange } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import { localisationService } from '@oneblink/apps'

type RemainingPickerProps = Omit<
  MobileDatePickerProps<Date>,
  | 'onError'
  | 'renderInput'
  | 'toolbarFormat'
  | 'rightArrowIcon'
  | 'leftArrowIcon'
  | 'maxDate'
  | 'minDate'
  | 'inputFormat'
>

type TextFieldProps = React.ComponentProps<typeof TextField>
type IconButtonProps = React.ComponentProps<typeof IconButton>

type Props = RemainingPickerProps & {
  name?: string
  label?: string
  maxDate?: string | Date
  maxDateMessage?: string
  minDate?: string | Date
  minDateMessage?: string
  margin?: TextFieldProps['margin']
  size?: TextFieldProps['size']
  placeholder?: string
  InputProps?: TextFieldProps['InputProps']
  inputVariant?: TextFieldProps['variant']
  onBlur?: TextFieldProps['onBlur']
  startIconButton?: boolean
  endIconButton?: boolean
  iconButtonEdge?: IconButtonProps['edge']
  iconButtonSize?: IconButtonProps['size']
  helperText?: string | React.ReactNode
  error?: boolean
  required?: boolean
  'data-cypress'?: string
}

const emptyFn = () => {
  //
}
const V4CompatibleDatePicker = ({
  name,
  label,
  maxDate,
  maxDateMessage,
  minDate,
  minDateMessage,
  margin,
  size,
  placeholder,
  InputProps,
  onChange,
  inputVariant,
  onBlur,
  disabled,
  startIconButton,
  endIconButton,
  iconButtonEdge,
  iconButtonSize,
  helperText: helperTextProp,
  error,
  required,
  'data-cypress': dataCypress,
  ...rest
}: Props) => {
  const [isOpen, setIsOpen, setIsClosed] = useBooleanState(false)
  const [helperText, setHelperText] = React.useState<string | undefined>(
    undefined,
  )
  const handleError = React.useCallback(
    (error: Parameters<Required<MobileDatePickerProps>['onError']>[0]) => {
      switch (error) {
        case 'invalidDate': {
          return setHelperText('Invalid Date Time')
        }
        case 'maxDate': {
          return setHelperText(maxDateMessage)
        }
        case 'minDate': {
          return setHelperText(minDateMessage)
        }
        default: {
          return setHelperText(undefined)
        }
      }
    },
    [maxDateMessage, minDateMessage],
  )

  const convertedMaxDate = React.useMemo(() => {
    if (typeof maxDate === 'string') {
      return new Date(maxDate)
    }
  }, [maxDate])
  const convertedMinDate = React.useMemo(() => {
    if (typeof minDate === 'string') {
      return new Date(minDate)
    }
  }, [minDate])

  const onAccept = React.useCallback(
    (date: Date | null) => {
      const currentValue =
        rest.value instanceof Date ? rest.value.toISOString() : rest.value

      if (currentValue !== (date?.toISOString() || null)) {
        onChange(date)
      }
    },
    [onChange, rest.value],
  )

  return (
    <MobileDatePicker
      open={isOpen}
      onOpen={setIsOpen}
      onClose={setIsClosed}
      renderInput={(props) => (
        <TextField
          {...props}
          name={name}
          label={label}
          required={required}
          helperText={helperTextProp || helperText}
          {...(error ? { error } : {})}
          fullWidth
          margin={margin}
          size={size}
          placeholder={placeholder}
          variant={inputVariant}
          onBlur={onBlur}
          InputProps={{
            startAdornment: startIconButton ? (
              <InputAdornment position="start">
                <IconButton
                  edge={iconButtonEdge}
                  size={iconButtonSize}
                  onClick={setIsOpen}
                  disabled={disabled}
                >
                  <DateRange />
                </IconButton>
              </InputAdornment>
            ) : undefined,
            endAdornment: endIconButton ? (
              <InputAdornment position="end">
                <IconButton
                  edge={iconButtonEdge}
                  size={iconButtonSize}
                  onClick={setIsOpen}
                  disabled={disabled}
                >
                  <DateRange />
                </IconButton>
              </InputAdornment>
            ) : undefined,
            ...(InputProps ? InputProps : {}),
          }}
          data-cypress={dataCypress}
        />
      )}
      maxDate={convertedMaxDate}
      minDate={convertedMinDate}
      onError={handleError}
      // This triggers everytime a component of the while date changes within the picker
      onChange={emptyFn}
      onAccept={onAccept}
      inputFormat={localisationService.dateFnsFormats.shortDateFormat}
      disabled={disabled}
      {...rest}
    />
  )
}

export default React.memo<Props>(V4CompatibleDatePicker)
