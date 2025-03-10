import * as React from 'react'
import { PickersActionBarAction } from '@mui/x-date-pickers'
import clsx from 'clsx'
import useBooleanState from '../useBooleanState'
import { PopperProps, TextFieldProps } from '@mui/material'
import Tooltip from '../../components/renderer/Tooltip'
import MaterialIcon from '../../components/MaterialIcon'

export const PickerInputButton = React.memo(function PickerInputButton({
  icon,
  tooltip,
  onClick,
}: {
  icon: string
  tooltip: string
  onClick: () => void
}) {
  return (
    <div className="control">
      <Tooltip title={tooltip}>
        <button
          onClick={onClick}
          className="button is-input-addon"
          type="button"
        >
          <span className="icon">
            <MaterialIcon>{icon}</MaterialIcon>
          </span>
        </button>
      </Tooltip>
    </div>
  )
})

const Input = React.forwardRef<
  HTMLDivElement,
  TextFieldProps & {
    ownerState?: unknown
  }
>(function Input(
  {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    focused,
    sx,
    label,
    size,
    ownerState,
    defaultValue,
    InputProps,
    error,
    /* eslint-enable @typescript-eslint/no-unused-vars */
    inputProps,
    inputRef,
    value,
    ...props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  },
  ref,
) {
  return (
    <div className="control is-expanded has-icons-right" ref={ref}>
      <input
        ref={inputRef}
        value={value as string}
        {...props}
        {...inputProps}
      />
    </div>
  )
})

export default function useFormDatePickerProps({
  id,
  value,
  maxDate,
  minDate,
  ariaDescribedby,
  placeholder,
  disabled,
  className,
  onBlur,
  onChange,
}: {
  id: string
  value: string | undefined
  maxDate: string | undefined
  minDate: string | undefined
  ariaDescribedby: string | undefined
  placeholder: string | undefined
  disabled: boolean | undefined
  className: string
  onBlur: () => void
  onChange: (newDate: Date | undefined) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isPickerOpen, openPicker, closePicker] = useBooleanState(false)

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

  return [
    {
      slots: {
        textField: Input,
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
        popper: {
          container: ref.current,
          anchorEl: ref.current,
        } as Partial<PopperProps>,
        textField: {
          id,
          placeholder: placeholder,
          'aria-describedby': ariaDescribedby,
          onBlur,
          className: clsx('input ob-input', className),
        } as TextFieldProps,
      },
      ref,
      open: isPickerOpen,
      onClose: () => {
        onBlur()
        closePicker()
      },
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
      disabled,
    },
    openPicker,
  ] as const
}
