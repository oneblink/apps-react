import * as React from 'react'
import { Header } from '@tanstack/react-table'
import {
  Box,
  Button,
  Grid,
  IconButton,
  Popover,
  SxProps,
  styled,
} from '@mui/material'
import MaterialIcon from '../../MaterialIcon'
import { useIsHovering } from '../../../hooks/useIsHovering'
import useNullableState from '../../../hooks/useNullableState'
import ColumnFilters from './ColumnFilters'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  margin: theme.spacing(-1, -1, -1, 1),
}))

const paperStyles: SxProps = {
  maxWidth: 500,
}

function HeaderCellMoreButton({
  header,
  onHide,
}: {
  // TODO refine this type a little
  header: Header<FormStoreRecord, unknown>
  onHide: () => void
}) {
  const isHovering = useIsHovering()
  const [anchorEl, setAnchorEl, clearAnchorEl] =
    useNullableState<HTMLButtonElement>(null)

  return (
    <span>
      <StyledIconButton
        color="inherit"
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          event.stopPropagation()
          setAnchorEl(event.currentTarget)
        }}
      >
        <MaterialIcon
          fontSize="small"
          color={isHovering ? 'action' : 'disabled'}
        >
          more_vert
        </MaterialIcon>
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
        slotProps={{
          paper: {
            sx: paperStyles,
          },
        }}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        {header.column.columnDef.meta?.filter && (
          <Box padding={2}>
            <ColumnFilters filter={header.column.columnDef.meta?.filter} />
          </Box>
        )}

        <Box paddingX={2} paddingY={1}>
          <Grid container justifyContent="flex-end" spacing={1}>
            {header.column.columnDef.meta?.filter && (
              <Grid>
                <Button
                  variant="outlined"
                  disabled={
                    header.column.columnDef.meta?.filter.value === undefined
                  }
                  onClick={() =>
                    header.column.columnDef.meta?.filter?.onChange(
                      undefined,
                      false,
                    )
                  }
                  size="small"
                  startIcon={<MaterialIcon>filter_list</MaterialIcon>}
                >
                  Clear
                </Button>
              </Grid>
            )}
            <Grid>
              <Button
                variant="outlined"
                onClick={onHide}
                size="small"
                startIcon={<MaterialIcon>visibility_off</MaterialIcon>}
              >
                Hidealins
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </span>
  )
}

export default React.memo(HeaderCellMoreButton)
