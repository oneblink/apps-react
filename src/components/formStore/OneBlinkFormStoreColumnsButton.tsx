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
import useBooleanState from '../../hooks/useBooleanState'
import useFormStoreTableContext from './useFormStoreTableContext'
import { ListItem, UnorderedList } from '../Lists'
import MaterialIcon from '../MaterialIcon'

function OneBlinkFormStoreColumnsButton(
  props: React.ComponentProps<typeof Button>,
) {
  const {
    getAllFlatColumns,
    parameters,
    onChangeParameters,
    getToggleAllColumnsVisibilityHandler,
    getIsAllColumnsVisible,
    getVisibleFlatColumns,
  } = useFormStoreTableContext()
  const [
    isConfiguringColumns,
    showColumnConfiguration,
    hideColumnConfiguration,
  ] = useBooleanState(false)
  const [isHelpOpen, , , toggleHelp] = useBooleanState(false)

  const allColumns = getAllFlatColumns()

  const hasRepeatableSets = React.useMemo(
    () =>
      parameters.unwindRepeatableSets ||
      allColumns.some(
        (c) => c.columnDef.meta?.formElementType === 'repeatableSet',
      ),
    [parameters.unwindRepeatableSets, allColumns],
  )

  return (
    <>
      <Button
        className="ob-form-store-columns-button"
        startIcon={<MaterialIcon>settings</MaterialIcon>}
        onClick={showColumnConfiguration}
        {...props}
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
          {hasRepeatableSets && (
            <>
              <Grid container>
                <Grid>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox checked={!!parameters.unwindRepeatableSets} />
                      }
                      onChange={(e, checked) => {
                        onChangeParameters(
                          (currentParameters) => ({
                            ...currentParameters,
                            sorting: checked
                              ? currentParameters.sorting
                              : [
                                  {
                                    property: 'dateTimeSubmitted',
                                    direction: 'descending',
                                  },
                                ],
                            unwindRepeatableSets: checked,
                          }),
                          false,
                        )
                      }}
                      label="Output a row per repeatable set entry"
                    />
                  </FormGroup>
                </Grid>
                <Grid>
                  <IconButton onClick={toggleHelp}>
                    <MaterialIcon>help</MaterialIcon>
                  </IconButton>
                </Grid>
              </Grid>
              <Collapse in={isHelpOpen}>
                <Alert severity="info">
                  <AlertTitle>When this setting is enabled:</AlertTitle>
                  <UnorderedList>
                    <ListItem>
                      Repeatable set columns will be expanded and create
                      duplicate rows per entry
                    </ListItem>
                    <ListItem>
                      Columns inside repeatable set entries can be sorted and
                      filtered
                    </ListItem>
                    <ListItem>
                      Columns inside repeatable set entries will be included in
                      the CSV download
                    </ListItem>
                  </UnorderedList>
                </Alert>
              </Collapse>
              <Box marginY={2}>
                <Divider />
              </Box>
            </>
          )}
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={getToggleAllColumnsVisibilityHandler()}
                  checked={getIsAllColumnsVisible()}
                  indeterminate={getVisibleFlatColumns().length > 0}
                />
              }
              label={<b>Toggle All</b>}
            />
            {allColumns.map((column) => {
              return (
                <React.Fragment key={column.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                    }
                    label={
                      <>
                        {column.columnDef.header}
                        {column.columnDef.meta?.tooltip && (
                          <Typography component="span" color="textSecondary">
                            {' '}
                            ({column.columnDef.meta?.tooltip})
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

/**
 * @param props
 * @returns
 * @group Components
 */
export default React.memo(OneBlinkFormStoreColumnsButton)
