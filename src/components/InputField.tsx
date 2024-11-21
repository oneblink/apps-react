import * as React from 'react'
import { TextField } from '@mui/material'
import InputClear from './InputClear'

type Props = React.ComponentProps<typeof TextField> & {
  onClear?: () => void
}

const InputField = ({
  margin = 'dense',
  variant = 'outlined',
  size = 'small',
  InputProps,
  onClear,
  ...props
}: Props) => {
  const inputProps = React.useMemo(() => {
    if (InputProps) return InputProps
    if (onClear) {
      return {
        endAdornment: (
          <InputClear
            select={props.select}
            value={props.value}
            onClear={onClear}
          />
        ),
      }
    }
  }, [InputProps, onClear, props.select, props.value])

  return (
    <TextField
      variant={variant}
      margin={margin}
      InputProps={inputProps}
      size={size}
      {...props}
    />
  )
}

export default React.memo<Props>(InputField)
