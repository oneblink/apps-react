import * as React from 'react'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import useFormStoreTableContext from './useFormStoreTableContext'

function OneBlinkFormStoreColumnsButton(
  props: React.ComponentProps<typeof Button>,
) {
  const {
    getToggleHideAllColumnsProps,
    allColumns,
    parameters,
    onChangeParameters,
  } = useFormStoreTableContext()
  const [
    isConfiguringColumns,
    showColumnConfiguration,
    hideColumnConfiguration,
  ] = useBooleanState(false)

  const toggleHideAllColumnsProps = getToggleHideAllColumnsProps()

  return (
    <>
      <Button
        className="ob-form-store-columns-button"
        startIcon={<SettingsIcon />}
        onClick={showColumnConfiguration}
        // eslint-disable-next-line react/no-children-prop
        children={<>Columns</>}
        {...props}
      />
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
              control={<Checkbox checked={!!parameters.unwindRepeatableSets} />}
              onChange={(e, checked) => {
                onChangeParameters(
                  (currentParameters) => ({
                    ...currentParameters,
                    unwindRepeatableSets: checked,
                  }),
                  false,
                )
              }}
              label="Flatten repeatable set entries"
            />
          </FormGroup>
          <Box marginY={2}>
            <Divider />
          </Box>
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

export default React.memo(OneBlinkFormStoreColumnsButton)
