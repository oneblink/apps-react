import * as React from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Typography,
} from '@mui/material'
import { Help, Settings as SettingsIcon } from '@mui/icons-material'
import useBooleanState from '../../hooks/useBooleanState'
import useFormStoreTableContext from './useFormStoreTableContext'
import { ListItem, UnorderedList } from '../Lists'

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
  const [isHelpOpen, , , toggleHelp] = useBooleanState(false)

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
          <Grid container>
            <Grid item>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox checked={!!parameters.unwindRepeatableSets} />
                  }
                  onChange={(e, checked) => {
                    onChangeParameters(
                      (currentParameters) => ({
                        ...currentParameters,
                        unwindRepeatableSets: checked,
                      }),
                      false,
                    )
                  }}
                  label="Output a row per repeatable set entry"
                />
              </FormGroup>
            </Grid>
            <Grid item>
              <IconButton onClick={toggleHelp}>
                <Help />
              </IconButton>
            </Grid>
          </Grid>
          <Collapse in={isHelpOpen}>
            <Alert severity="info">
              <AlertTitle>When this setting is enabled:</AlertTitle>
              <UnorderedList>
                <ListItem>
                  Repeatable set columns will be expanded and create duplicate
                  rows per entry
                </ListItem>
                <ListItem>
                  Columns inside repeatable set entries can be sorted and
                  filtered
                </ListItem>
                <ListItem>
                  Columns inside repeatable set entries will be included in the
                  CSV download
                </ListItem>
              </UnorderedList>
            </Alert>
          </Collapse>
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
