import * as React from 'react'
import { Tooltip } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import CsvIcon from '@mui/icons-material/Download'
import ErrorSnackbar from '../ErrorSnackbar'
import { ColumnInstance } from 'react-table'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { formStoreService } from '@oneblink/apps'
import useFormStoreTableContext from './useFormStoreTableContext'

function OneBlinkFormStoreDownloadButton(
  props: React.ComponentProps<typeof LoadingButton>,
) {
  const { visibleColumns, filters, form } = useFormStoreTableContext()
  const [{ isDownloadingCsv, downloadingCsvError }, setState] = React.useState<{
    isDownloadingCsv: boolean
    downloadingCsvError: Error | null
  }>({
    isDownloadingCsv: false,
    downloadingCsvError: null,
  })
  const clearError = React.useCallback(() => {
    setState({
      isDownloadingCsv: false,
      downloadingCsvError: null,
    })
  }, [])

  const downloadCsv = React.useCallback(async () => {
    setState({ isDownloadingCsv: true, downloadingCsvError: null })
    try {
      await formStoreService.exportFormStoreRecords(form.name, {
        formId: form.id,
        filters,
        includeColumns: visibleColumns.map(
          (visibleColumn: ColumnInstance<FormStoreRecord>) => visibleColumn.id,
        ),
      })
      setState({
        isDownloadingCsv: false,
        downloadingCsvError: null,
      })
    } catch (error) {
      setState({
        isDownloadingCsv: false,
        downloadingCsvError: error as Error,
      })
    }
  }, [form, filters, visibleColumns])

  return (
    <>
      <Tooltip title="Download submission data as a CSV file">
        <LoadingButton
          type="button"
          loading={isDownloadingCsv}
          loadingPosition="start"
          startIcon={<CsvIcon />}
          onClick={downloadCsv}
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
    </>
  )
}
export default React.memo(OneBlinkFormStoreDownloadButton)
