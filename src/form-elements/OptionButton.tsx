import * as React from 'react'
import useContrastColor from '../hooks/useContrastColor'
import { FormTypes } from '@oneblink/types'
type Props = {
  element:
    | FormTypes.RadioButtonElement
    | FormTypes.CheckboxElement
    | FormTypes.ComplianceElement
  option: FormTypes.ChoiceElementOption
  isSelected: boolean
  onClick: () => void
  className: string
  'aria-describedby'?: string
}
const OptionButton = ({
  element,
  option,
  isSelected,
  onClick,
  className,
  ...props
}: Props) => {
  const buttonContrastColor = useContrastColor(option.colour)
  return (
    <button
      type="button"
      className={className}
      style={
        option.colour && isSelected
          ? { backgroundColor: option.colour, color: buttonContrastColor }
          : undefined
      }
      disabled={element.readOnly}
      onClick={onClick}
      aria-describedby={props['aria-describedby']}
    >
      {option.label}
    </button>
  )
}

export default React.memo<Props>(OptionButton)
