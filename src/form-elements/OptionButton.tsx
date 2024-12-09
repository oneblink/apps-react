import * as React from 'react'
import useContrastColor from '../hooks/useContrastColor'
import { FormTypes } from '@oneblink/types'
import { Box } from '@mui/material'

type Props = {
  element:
    | FormTypes.RadioButtonElement
    | FormTypes.CheckboxElement
    | FormTypes.ComplianceElement
  option: FormTypes.ChoiceElementOption
  isSelected: boolean
  onClick: () => void
  className: string
  onBlur?: () => void
  'aria-describedby'?: string
}
const OptionButton = ({
  element,
  option,
  isSelected,
  onClick,
  className,
  onBlur,
  ...props
}: Props) => {
  const buttonContrastColor = useContrastColor(option.colour)

  return (
    <button
      type="button"
      className={className}
      style={
        option.colour && isSelected
          ? {
              backgroundColor: option.colour,
              color: buttonContrastColor,
              height: 'auto',
            }
          : { height: 'auto' }
      }
      disabled={element.readOnly}
      onClick={onClick}
      aria-describedby={props['aria-describedby']}
      onBlur={onBlur}
    >
      <Box
        display="flex"
        flexDirection="column"
        className="ob-options__box"
        maxWidth={256}
      >
        {option.imageUrl && (
          <img
            className="ob-options__image"
            src={option.imageUrl}
            alt={option.label}
          />
        )}
        {option.label}
      </Box>
    </button>
  )
}

export default React.memo<Props>(OptionButton)
