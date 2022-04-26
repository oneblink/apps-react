import * as React from 'react'
import { ColumnInstance } from 'react-table'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import { SubmissionTypes } from '@oneblink/types'

function ColumnsConfigurationButton({
  allColumns,
  getToggleHideAllColumnsProps,
}: {
  allColumns: ColumnInstance<SubmissionTypes.FormStoreRecord>[]
  getToggleHideAllColumnsProps: () => React.ComponentProps<typeof Checkbox>
}) {
  const [
    isConfiguringColumns,
    showColumnConfiguration,
    hideColumnConfiguration,
  ] = useBooleanState(false)

  const toggleHideAllColumnsProps = getToggleHideAllColumnsProps()

  return (
    <>
      <Button
        startIcon={<SettingsIcon />}
        onClick={showColumnConfiguration}
        variant="outlined"
      >
        Columns
      </Button>
      <Dialog
        open={isConfiguringColumns}
        maxWidth="sm"
        fullWidth
        onClose={hideColumnConfiguration}
      >
        <DialogTitle>Column Configuration</DialogTitle>
        <DialogContent dividers>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  {...toggleHideAllColumnsProps}
                  indeterminate={!!toggleHideAllColumnsProps.indeterminate}
                />
              }
              label={<b>Toggle All</b>}
            />
            {allColumns.map((column) => {
              return (
                <React.Fragment key={column.id}>
                  <FormControlLabel
                    control={<Checkbox {...column.getToggleHiddenProps()} />}
                    label={
                      <>
                        {column.headerText}
                        {column.tooltip && (
                          <Typography component="span" color="textSecondary">
                            {' '}
                            ({column.tooltip})
                          </Typography>
                        )}
                      </>
                    }
                  />
                </React.Fragment>
              )
            })}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={hideColumnConfiguration}
            color="primary"
            variant="contained"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default React.memo(ColumnsConfigurationButton)
