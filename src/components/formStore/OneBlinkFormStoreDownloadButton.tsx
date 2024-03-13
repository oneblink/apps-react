import * as React from 'react'
import {
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import ErrorSnackbar from '../ErrorSnackbar'
import { ColumnInstance } from 'react-table'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { formStoreService } from '@oneblink/apps'
import useFormStoreTableContext from './useFormStoreTableContext'
import MaterialIcon from '../MaterialIcon'

function OneBlinkFormStoreDownloadButton(
  props: React.ComponentProps<typeof LoadingButton>,
) {
  const { visibleColumns, parameters, form } = useFormStoreTableContext()
  const [
    { isDownloadingCsv, isPromptingDownloadCsv, downloadingCsvError },
    setState,
  ] = React.useState<{
    isDownloadingCsv: boolean
    isPromptingDownloadCsv: boolean
    downloadingCsvError: Error | null
  }>({
    isDownloadingCsv: false,
    isPromptingDownloadCsv: false,
    downloadingCsvError: null,
  })

  const clearError = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      downloadingCsvError: null,
    }))
  }, [])

  const downloadCsv = React.useCallback(async () => {
    setState({
      isPromptingDownloadCsv: false,
      isDownloadingCsv: true,
      downloadingCsvError: null,
    })
    try {
      await formStoreService.exportFormStoreRecords(form.name, {
        formId: form.id,
        includeColumns: visibleColumns.map(
          (visibleColumn: ColumnInstance<FormStoreRecord>) => visibleColumn.id,
        ),
        ...parameters,
      })
      setState((currentState) => ({
        ...currentState,
        isDownloadingCsv: false,
        downloadingCsvError: null,
      }))
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isDownloadingCsv: false,
        downloadingCsvError: error as Error,
      }))
    }
  }, [form, parameters, visibleColumns])

  const promptDownloadCsv = React.useCallback(() => {
    if (
      !parameters.unwindRepeatableSets &&
      visibleColumns.some((c) => c.formElementType === 'repeatableSet')
    ) {
      setState((currentState) => ({
        ...currentState,
        downloadingCsvError: null,
        isPromptingDownloadCsv: true,
      }))
      return
    }
    downloadCsv()
  }, [downloadCsv, parameters.unwindRepeatableSets, visibleColumns])

  const cancelPromptDownloadCsv = React.useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      isPromptingDownloadCsv: false,
    }))
  }, [])

  return (
    <>
      <Tooltip title="Download submission data as a CSV file">
        <LoadingButton
          className="ob-form-store-download-csv-button"
          type="button"
          loading={isDownloadingCsv}
          loadingPosition="start"
          startIcon={() => <MaterialIcon>download</MaterialIcon>}
          onClick={promptDownloadCsv}
          // eslint-disable-next-line react/no-children-prop
          children={<>Download</>}
          {...props}
        />
      </Tooltip>

      <ErrorSnackbar open={!!downloadingCsvError} onClose={clearError}>
        <span data-cypress="edit-dialog-error-message">
          {downloadingCsvError && downloadingCsvError.message}
        </span>
      </ErrorSnackbar>

      <Dialog
        open={isPromptingDownloadCsv}
        maxWidth="sm"
        fullWidth
        onClose={cancelPromptDownloadCsv}
      >
        <DialogTitle>Column Configuration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Repeatable set columns will not be included in the export unless the{' '}
            <b>Output a row per repeatable set entry</b> option is turned on
            under <b>Column Configuration</b>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelPromptDownloadCsv} variant="text">
            Cancel
          </Button>
          <Button
            onClick={downloadCsv}
            startIcon={<MaterialIcon>download</MaterialIcon>}
            color="primary"
            variant="contained"
          >
            Download
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
export default React.memo(OneBlinkFormStoreDownloadButton)
