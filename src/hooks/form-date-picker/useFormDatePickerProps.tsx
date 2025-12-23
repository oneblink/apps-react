import * as React from 'react'
import {
  PickersActionBarAction,
  UseDateFieldProps,
  BaseSingleInputFieldProps,
  unstable_useDateField as useDateField,
  useClearableField,
} from '@mui/x-date-pickers'
import clsx from 'clsx'
import useBooleanState from '../useBooleanState'
import { useMediaQuery } from '@mui/material'
import { unstable_useForkRef as useForkRef } from '@mui/utils'
import { DateValidationError, FieldSection } from '@mui/x-date-pickers/models'
import Tooltip from '../../components/renderer/Tooltip'
import MaterialIcon from '../../components/MaterialIcon'

interface DatePickerInputProps
  extends UseDateFieldProps<Date, false>,
    BaseSingleInputFieldProps<
      Date | null,
      Date,
      FieldSection,
      false,
      DateValidationError
    > {}

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
          className="button is-input-addon cypress-date-picker-button"
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

// from https://v7.mui.com/x/react-date-pickers/custom-field/#usage-with-an-unstyled-input
function DatePickerInput(props: DatePickerInputProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { slots, slotProps, ref, ...textFieldProps } = props

  const _fieldProps = useDateField<Date, false, typeof textFieldProps>({
    ...textFieldProps,
    enableAccessibleFieldDOMStructure: false,
  })

  const fieldProps = useClearableField({ ..._fieldProps, slots, slotProps })

  const {
    // These props cannot be passed to the input
    /* eslint-disable @typescript-eslint/no-unused-vars */
    enableAccessibleFieldDOMStructure,
    label,
    error,
    focused,
    sx,
    inputProps,
    // @ts-expect-error exists despite type not saying so
    ownerState,
    /* @ts-expect-error exists despite type not saying so */
    ampm,
    /* @ts-expect-error exists despite type not saying so */
    minTime,
    /* @ts-expect-error exists despite type not saying so */
    maxTime,
    /* @ts-expect-error exists despite type not saying so */
    disableIgnoringDatePartForTimeValidation,
    /* eslint-enable @typescript-eslint/no-unused-vars */

    disabled,
    inputRef,
    InputProps: { ref: containerRef } = {},
    ...rest
  } = fieldProps

  const handleRef = useForkRef(containerRef, ref)

  return (
    <div className="control is-expanded has-icons-right" ref={handleRef}>
      <input
        disabled={disabled}
        ref={inputRef as React.Ref<HTMLInputElement>}
        {...rest}
      />
    </div>
  )
}

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
  required,
}: {
  id: string
  value: string | undefined
  maxDate: string | undefined
  minDate: string | undefined
  ariaDescribedby: string | undefined
  placeholder: string | undefined
  disabled: boolean | undefined
  className: string
  required: boolean
  onBlur: () => void
  onChange: (newDate: Date | undefined) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  // we need a controlled picker state because we do our own calendar icon
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
  // default used by mui to determine when the mobile picker is used
  // https://mui.com/x/react-date-pickers/date-picker/#available-components
  const desktopMediaQuery = '@media (pointer: fine)'

  const isDesktop = useMediaQuery(desktopMediaQuery)

  const openPickerOnMobile = React.useCallback(() => {
    if (!isDesktop) {
      openPicker()
    }
  }, [isDesktop, openPicker])

  return [
    {
      slots: {
        field: DatePickerInput,
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
        field: {
          id,
          placeholder: placeholder,
          'aria-describedby': ariaDescribedby,
          'aria-required': required,
          onBlur,
          className: clsx('input ob-input', className),
          onClick: openPickerOnMobile,
        },
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
      desktopMediaQuery,
      enableAccessibleFieldDOMStructure: false,
    },
    openPicker,
  ] as const
}
