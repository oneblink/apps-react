import * as React from 'react'
import {
  MobileDateTimePicker,
  MobileDateTimePickerProps,
} from '@mui/x-date-pickers'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { AccessTime, DateRange } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import { localisationService } from '@oneblink/apps'
import { PickersActionBarAction } from '@mui/x-date-pickers/PickersActionBar/PickersActionBar'

type RemainingPickerProps = Omit<
  MobileDateTimePickerProps<string | Date, Date>,
  | 'onError'
  | 'renderInput'
  | 'toolbarFormat'
  | 'timeIcon'
  | 'dateRangeIcon'
  | 'rightArrowIcon'
  | 'leftArrowIcon'
  | 'maxDate'
  | 'minDate'
  | 'inputFormat'
>

type TextFieldProps = React.ComponentProps<typeof TextField>
type IconButtonProps = React.ComponentProps<typeof IconButton>

type Props = RemainingPickerProps & {
  name?: TextFieldProps['name']
  label?: TextFieldProps['label']
  maxDate?: string | Date
  maxDateMessage?: string
  minDate?: string | Date
  minDateMessage?: string
  margin?: TextFieldProps['margin']
  size?: TextFieldProps['size']
  placeholder?: TextFieldProps['placeholder']
  InputProps?: TextFieldProps['InputProps']
  inputVariant?: TextFieldProps['variant']
  onBlur?: TextFieldProps['onBlur']
  startIconButton?: boolean
  endIconButton?: boolean
  iconButtonEdge?: IconButtonProps['edge']
  iconButtonSize?: IconButtonProps['size']
  helperText?: TextFieldProps['helperText']
  error?: TextFieldProps['error']
  required?: TextFieldProps['required']
  showTodayButton?: boolean
  clearable?: boolean
  'data-cypress'?: string
}

const V4CompatibleDateTimePicker = ({
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
  showTodayButton,
  clearable,
  value: valueProp,
  'data-cypress': dataCypress,
  ...rest
}: Props) => {
  const [value, setValue] = React.useState<typeof valueProp>(null)
  const [isOpen, setIsOpen, setIsClosed] = useBooleanState(false)
  const [helperText, setHelperText] = React.useState<string | undefined>(
    undefined,
  )
  const handleError = React.useCallback(
    (
      error: Parameters<
        Required<MobileDateTimePickerProps<string | Date, Date>>['onError']
      >[0],
    ) => {
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
        valueProp instanceof Date ? valueProp.toISOString() : valueProp
      if (currentValue !== (date?.toISOString() || null)) {
        onChange(date)
      }
    },
    [onChange, valueProp],
  )

  const actions = React.useMemo(() => {
    const actions: PickersActionBarAction[] = ['cancel', 'accept']
    if (showTodayButton) {
      actions.unshift('today')
    }
    if (clearable) {
      actions.unshift('clear')
    }
    return actions
  }, [clearable, showTodayButton])

  React.useEffect(() => {
    setValue(valueProp)
  }, [valueProp])

  return (
    <MobileDateTimePicker
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
          error={error}
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
      timeIcon={<AccessTime />}
      dateRangeIcon={<DateRange />}
      onChange={setValue}
      value={value}
      onAccept={onAccept}
      inputFormat={localisationService.getDateFnsFormats().shortDateTime}
      disabled={disabled}
      componentsProps={{
        actionBar: {
          actions,
        },
      }}
      {...rest}
    />
  )
}

export default React.memo<Props>(V4CompatibleDateTimePicker)
