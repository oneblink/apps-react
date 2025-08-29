import { styled, Stack, IconButton, Slider } from '@mui/material'
import MaterialIcon from '../MaterialIcon'
import * as React from 'react'

export const CropContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'height',
})<{ height?: number }>(({ height }) => ({
  position: 'relative',
  width: '100%',
  ...(height ? { height } : { flex: 1 }),
}))

const SLIDER_STEP_INTERVAL_VALUE = 0.025
const SLIDER_MIN_VALUE = 1
const SLIDER_MAX_VALUE = 3
const SLIDER_BUTTON_INTERVAL_VALUE = SLIDER_STEP_INTERVAL_VALUE * 10
export const SLIDER_WHEEL_INTERVAL_VALUE = SLIDER_STEP_INTERVAL_VALUE * 6

export const ZoomSlider = ({
  value,
  disabled = false,
  setValue,
}: {
  value: number
  disabled?: boolean
  setValue: (value: number) => void
}) => {
  return (
    <Stack
      spacing={2}
      direction="row"
      alignItems="center"
      justifyContent="center"
      pt={3}
    >
      <IconButton
        disabled={value === SLIDER_MIN_VALUE || disabled}
        onClick={() => {
          const newValue = parseFloat(
            (value - SLIDER_BUTTON_INTERVAL_VALUE).toFixed(3),
          )
          setValue(newValue < SLIDER_MIN_VALUE ? SLIDER_MIN_VALUE : newValue)
        }}
        className="ob-cropper__zoom-slider-minus-button"
      >
        <MaterialIcon>remove</MaterialIcon>
      </IconButton>
      <Slider
        aria-label="Image Zoom"
        value={value}
        min={SLIDER_MIN_VALUE}
        max={SLIDER_MAX_VALUE}
        step={SLIDER_STEP_INTERVAL_VALUE}
        onChange={(e, value) => typeof value === 'number' && setValue(value)}
        disabled={disabled}
        className="ob-cropper__zoom-slider"
      />
      <IconButton
        disabled={value === SLIDER_MAX_VALUE || disabled}
        onClick={() => {
          const newValue = parseFloat(
            (value + SLIDER_BUTTON_INTERVAL_VALUE).toFixed(3),
          )
          setValue(newValue > SLIDER_MAX_VALUE ? SLIDER_MAX_VALUE : newValue)
        }}
        className="ob-cropper__zoom-slider-plus-button"
      >
        <MaterialIcon>add</MaterialIcon>
      </IconButton>
    </Stack>
  )
}
