import * as React from 'react'
import { HeaderGroup } from 'react-table'
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Popover,
  SxProps,
  styled,
  TypeAction,
} from '@mui/material'
import MaterialIcon from '../../MaterialIcon'
import { useIsHovering } from '../../../hooks/useIsHovering'
import useNullableState from '../../../hooks/useNullableState'
import ColumnFilters from './ColumnFilters'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(-1, -1, -1, 1),
}))

const StyledMoreVert = styled(MaterialIcon)<{
  color: Extract<keyof TypeAction, 'active' | 'disabled'>
}>(({ theme, color }) => ({
  fontSize: theme.typography.subtitle1.fontSize,
  color: theme.palette.action[color],
}))

const paperStyles: SxProps = {
  maxWidth: 500,
}

function HeaderCellMoreButton({
  headerGroup,
  onHide,
}: {
  headerGroup: HeaderGroup<FormStoreRecord>
  onHide: () => void
}) {
  const isHovering = useIsHovering()
  const [anchorEl, setAnchorEl, clearAnchorEl] =
    useNullableState<HTMLButtonElement>(null)

  return (
    <span>
      <StyledIconButton
        color="inherit"
        onClick={(event) => {
          event.stopPropagation()
          setAnchorEl(event.currentTarget)
        }}
      >
        <StyledMoreVert color={isHovering ? 'active' : 'disabled'}>
          more_vert
        </StyledMoreVert>
      </StyledIconButton>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={(event: React.MouseEvent) => {
          event.stopPropagation()
          clearAnchorEl()
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: paperStyles,
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        {headerGroup.filter && (
          <>
            <Box padding={2}>
              <ColumnFilters filter={headerGroup.filter} />
            </Box>
            <Divider />
          </>
        )}
        <Box paddingX={2} paddingY={1}>
          <Grid container justifyContent="flex-end" spacing={1}>
            {headerGroup.filter && (
              <Grid item>
                <Button
                  variant="outlined"
                  disabled={headerGroup.filter.value === undefined}
                  onClick={() => headerGroup.filter?.onChange(undefined, false)}
                  size="small"
                  startIcon={<MaterialIcon>filter_list</MaterialIcon>}
                >
                  Clear
                </Button>
              </Grid>
            )}
            <Grid item>
              <Button
                variant="outlined"
                onClick={onHide}
                size="small"
                startIcon={<MaterialIcon>visiblity_off</MaterialIcon>}
              >
                Hide
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </span>
  )
}

export default React.memo(HeaderCellMoreButton)
