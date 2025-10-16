import {
  styled,
  Stack,
  IconButton,
  Slider,
  Box,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
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

export interface AspectRatio {
  width: number
  height: number
}
export const availableAspectRatios: AspectRatio[] = [
  {
    width: 21,
    height: 9,
  },
  {
    width: 16,
    height: 9,
  },
  {
    width: 16,
    height: 10,
  },
  {
    width: 3,
    height: 2,
  },
  {
    width: 4,
    height: 3,
  },
  {
    width: 5,
    height: 4,
  },
  {
    width: 1,
    height: 1,
  },
  {
    width: 4,
    height: 5,
  },
  {
    width: 9,
    height: 16,
  },
]
export const AspectRatioButton = ({
  selectedAspectRatio,
  onSelectAspectRatio,
}: {
  selectedAspectRatio: AspectRatio
  onSelectAspectRatio: (aspectRatio: AspectRatio) => void
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  // TODO: Don't just use MUI for everything here if Blake gives the ok for this implementation
  // TODO: Put styling in css files if Blake gives the ok for this implementation
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body1">Aspect Ratio</Typography>
      <button
        type="button"
        className="button ob-button is-outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <span
          style={{
            marginRight: 8,
          }}
        >
          {selectedAspectRatio.width}:{selectedAspectRatio.height}
        </span>
        <DrawAspectRatio {...selectedAspectRatio} />
      </button>
      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null)
        }}
      >
        {availableAspectRatios.map((aspectRatio) => (
          <MenuItem
            key={`${aspectRatio.width}:${aspectRatio.height}`}
            onClick={() => {
              onSelectAspectRatio(aspectRatio)
              setAnchorEl(null)
            }}
          >
            {aspectRatio.width}:{aspectRatio.height}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

const DrawAspectRatio = ({ height, width }: AspectRatio) => {
  const { displayWidth, displayHeight, iconSize } = React.useMemo(() => {
    const coefficient = 30 / height

    const iconSize = () => {
      if (width === height) {
        return 18
      }
      if (width === 9 && height === 16) {
        return 16
      }
      if (width < height) {
        return 16
      }
    }

    return {
      displayWidth: width * coefficient,
      displayHeight: 30,
      iconSize: iconSize(),
    }
  }, [height, width])

  return (
    <Box
      sx={(theme) => ({
        transition: 'width 0.3s ease-in-out',
        width: displayWidth,
        height: displayHeight,
        backgroundColor: theme.palette.grey[300],
        borderRadius: 1,
      })}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <MaterialIcon
        sx={{
          fontSize: iconSize,
          rotate: width === 9 && height === 16 ? '90deg' : undefined,
        }}
      >
        aspect_ratio
      </MaterialIcon>
    </Box>
  )
}
