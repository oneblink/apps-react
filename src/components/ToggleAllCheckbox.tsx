import * as React from 'react'
import clsx from 'clsx'
import { Checkbox } from '@material-ui/core'
import { FormTypes } from '@oneblink/types'
interface Props {
  id: string
  element: FormTypes.CheckboxElement | FormTypes.SelectElement
  options: FormTypes.ChoiceElementOption[]
  selected: string[]
  onChange: FormElementValueChangeHandler<string[]>
  disabled: boolean
}
const ToggleAllCheckbox = ({
  id,
  element,
  options,
  selected,
  onChange,
  disabled,
}: Props) => {
  const allSelected = React.useMemo(() => {
    return options.every((option) => {
      return selected.includes(option.value)
    })
  }, [options, selected])

  const handleToggleAll = React.useCallback(
    (isSelectingAll: boolean) => {
      if (isSelectingAll) {
        onChange(
          element,
          options.map((opt) => opt.value),
        )
      } else {
        onChange(element, undefined)
      }
    },
    [element, options, onChange],
  )

  return (
    <label
      className="checkbox ob-checkbox__input-label cypress-checkbox-label"
      htmlFor={`${id}_select-all`}
      style={{
        fontStyle: 'italic',
        marginBottom: '1.25rem',
      }}
    >
      <Checkbox
        color="default"
        className={clsx('ob-checkbox__input', 'cypress-checkbox-control', {
          'ob-checkbox__input-checked': allSelected,
        })}
        id={`${id}_select-all`}
        disableRipple
        inputProps={{ className: 'cypress-checkbox-input' }}
        checked={allSelected}
        indeterminate={!!selected.length && !allSelected}
        onChange={(e) => handleToggleAll(e.target.checked)}
        disabled={disabled}
      />
      {allSelected ? 'Deselect All' : 'Select All'}
    </label>
  )
}

export default React.memo<Props>(ToggleAllCheckbox)
