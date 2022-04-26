import * as React from 'react'
import { Zoom } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import CopyToClipboardIconButton from '../../CopyToClipboardIconButton'
import { useIsHovering } from '../../../hooks/useIsHovering'

const useStyles = makeStyles((theme) => ({
  iconButton: {
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      // Rough equivalent of the color created by transparency `rgba(0,0,0,0.04)` on white
      backgroundColor: '#f3f3f3',
    },
  },
  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
}))

function TableCellCopyButton({
  text,
  isHidden,
}: {
  text: string
  isHidden?: boolean
}) {
  const classes = useStyles()
  const isHovering = useIsHovering()
  if (isHidden) {
    return null
  }
  return (
    <Zoom in={isHovering}>
      <span className={classes.wrapper}>
        <CopyToClipboardIconButton text={text} className={classes.iconButton} />
      </span>
    </Zoom>
  )
}

export default React.memo(TableCellCopyButton)
