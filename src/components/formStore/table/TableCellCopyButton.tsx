import * as React from 'react'
import { Zoom } from '@mui/material'
import CopyToClipboardIconButton from '../../CopyToClipboardIconButton'
import { useIsHovering } from '../../../hooks/useIsHovering'
import { styled } from '@mui/styles'

function TableCellCopyButton({
  text,
  isHidden,
}: {
  text: string
  isHidden?: boolean
}) {
  const isHovering = useIsHovering()
  if (isHidden) {
    return null
  }
  return (
    <Zoom in={isHovering}>
      <StyledSpan>
        <StyledCopyToClipbaordButton text={text} />
      </StyledSpan>
    </Zoom>
  )
}

const StyledSpan = styled('span')(() => ({
  position: 'absolute',
  top: 0,
  right: 0,
}))

const StyledCopyToClipbaordButton = styled(CopyToClipboardIconButton)(
  ({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      // Rough equivalent of the color created by transparency `rgba(0,0,0,0.04)` on white
      backgroundColor: '#f3f3f3',
    },
  }),
)

export default React.memo(TableCellCopyButton)
