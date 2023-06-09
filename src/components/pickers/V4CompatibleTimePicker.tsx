import * as React from 'react'
import { MobileTimePicker, MobileTimePickerProps } from '@mui/x-date-pickers'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import { PickersActionBarAction } from '@mui/x-date-pickers/PickersActionBar/PickersActionBar'

type RemainingPickerProps = Omit<
  MobileTimePickerProps<string | Date, Date>,
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
  name?: TextFieldProps['name']
  label?: TextFieldProps['label']
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

const V4CompatibleTimePicker = ({
  name,
  label,
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
        Required<MobileTimePickerProps<string | Date, Date>>['onError']
      >[0],
    ) => {
      switch (error) {
        case 'invalidDate': {
          return setHelperText('Invalid Date Time')
        }
        default: {
          return setHelperText(undefined)
        }
      }
    },
    [],
  )

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
    <MobileTimePicker
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
                  <AccessTime />
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
                  <AccessTime />
                </IconButton>
              </InputAdornment>
            ) : undefined,
            ...(InputProps ? InputProps : {}),
          }}
          data-cypress={dataCypress}
        />
      )}
      onError={handleError}
      onChange={setValue}
      value={value}
      onAccept={onAccept}
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

/**
 * @param props
 * @returns
 * @group Components
 */
export default React.memo<Props>(V4CompatibleTimePicker)
