import * as React from 'react'
import { MobileTimePicker, MobileTimePickerProps } from '@mui/x-date-pickers'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'

type RemainingPickerProps = Omit<
  MobileTimePickerProps<Date>,
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
  'data-cypress': dataCypress,
  ...rest
}: Props) => {
  const [isOpen, setIsOpen, setIsClosed] = useBooleanState(false)
  const [helperText, setHelperText] = React.useState<string | undefined>(
    undefined,
  )
  const handleError = React.useCallback(
    (error: Parameters<Required<MobileTimePickerProps>['onError']>[0]) => {
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
        rest.value instanceof Date ? rest.value.toISOString() : rest.value

      if (currentValue !== (date?.toISOString() || null)) {
        onChange(date)
      }
    },
    [onChange, rest.value],
  )

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
      // This triggers everytime a component of the while date changes within the picker
      onChange={emptyFn}
      onAccept={onAccept}
      disabled={disabled}
      {...rest}
    />
  )
}

export default React.memo<Props>(V4CompatibleTimePicker)
