import * as React from 'react'
import useContrastColor from '../hooks/useContrastColor'
import { FormTypes } from '@oneblink/types'
type Props = {
  element: FormTypes.RadioButtonElement | FormTypes.CheckboxElement
  option: FormTypes.ChoiceElementOption
  isSelected: boolean
  onClick: () => void
  className: string
}
const OptionButton = ({
  element,
  option,
  isSelected,
  onClick,
  className,
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
    >
      {option.label}
    </button>
  )
}

export default React.memo<Props>(OptionButton)
