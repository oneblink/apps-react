import * as React from 'react'
import { useHistory } from 'react-router-dom'
import querystring from 'query-string'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { formStoreService } from '@oneblink/apps'
import useInfiniteScrollDataLoad from '../../hooks/useInfiniteScrollDataLoad'
import FormStoreTable from './table'
import useFormStoreTable from './table/useFormStoreTable'
import { Box, Button, Grid, Typography } from '@mui/material'
import {
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
} from '@mui/icons-material'
import { Form } from '@oneblink/types/typescript/forms'
import useSubmissionIdValidationMessage, {
  validateIsUUID,
} from '../../hooks/useSubmissionIdIsValid'
import { FormTypes } from '@oneblink/types'
import DownloadSubmissionDataButton from './DownloadSubmissionDataButton'
import ColumnsConfigurationButton from './ColumnsConfigurationButton'
import ErrorMessage from '../ErrorMessage'
import LoadingWithMessage from '../LoadingWithMessage'
import NoResourcesYet from '../NoResourcesYet'

function FormStoreContainer({
  form,
  formElements,
}: {
  form: Form
  formElements: FormTypes.FormElementWithName[]
}) {
  const history = useHistory()
  const {
    isLoading,
    loadError,
    records: formStoreRecords,
    onTryAgain,
    onRefresh,
    filters,
    onChangeFilters,
  } = useInfiniteScrollDataLoad<
    formStoreService.FormStoreFilters,
    FormStoreRecord
  >({
    limit: 50,
    debounceSearchMs: 1000,
    onDefaultFilters: React.useCallback((query) => {
      let filters: formStoreService.FormStoreFilters = {}
      try {
        if (typeof query.filters === 'string') {
          filters = JSON.parse(query.filters)
        }
      } catch (error) {
        console.warn('Could not parse filter as JSON', error)
      }
      if (!filters.sorting) {
        filters.sorting = [
          { property: 'dateTimeSubmitted', direction: 'descending' },
        ]
      }
      return filters
    }, []),
    onSearch: React.useCallback(
      async (filters, paging, abortSignal) => {
        // Exclude all search parameters if searching
        // for a specific submission using an identifier
        const searchFilters = filters.submissionId
          ? {
              submissionId: filters.submissionId,
            }
          : filters
        const result = await formStoreService.searchFormStoreRecords(
          {
            paging,
            formId: form.id,
            filters: searchFilters,
          },
          abortSignal,
        )
        return {
          records: result.formStoreRecords,
          meta: result.meta,
        }
      },
      [form.id],
    ),
    onValidateFilters: React.useCallback(
      (currentFilters: formStoreService.FormStoreFilters) => {
        return validateIsUUID(currentFilters.submissionId?.$eq)
      },
      [],
    ),
  })

  React.useEffect(() => {
    history.replace({
      search: querystring.stringify({
        filters: JSON.stringify(filters),
      }),
    })
  }, [filters, history])

  const submissionIdValidationMessage = useSubmissionIdValidationMessage(
    filters.submissionId?.$eq,
  )

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    allColumns,
    visibleColumns,
    getToggleHideAllColumnsProps,
  } = useFormStoreTable({
    formStoreRecords,
    filters,
    onChangeFilters,
    submissionIdValidationMessage,
    form,
    formElements,
  })

  return (
    <Box padding={2} paddingBottom={16}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={true}>
          <Typography variant="h6">{form?.name}</Typography>
        </Grid>
        <Grid item xs={false}>
          <Button
            startIcon={<FilterIcon />}
            disabled={!Object.keys(filters).length}
            onClick={() => {
              onChangeFilters(
                (currentFilters) => ({
                  sorting: currentFilters.sorting,
                }),
                false,
              )
            }}
            variant="text"
          >
            Clear Filters
          </Button>
        </Grid>
        <Grid item xs={false}>
          <ColumnsConfigurationButton
            allColumns={allColumns}
            getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
          />
        </Grid>
        <Grid item xs={false}>
          <DownloadSubmissionDataButton
            disabled={false}
            form={form}
            filters={filters}
            visibleColumns={visibleColumns}
          />
        </Grid>
        <Grid item xs={false}>
          <Button
            startIcon={<SyncIcon />}
            onClick={onRefresh}
            color="primary"
            variant="contained"
            disabled={!!submissionIdValidationMessage}
          >
            Refresh
          </Button>
        </Grid>
        <Grid item xs={12}>
          {visibleColumns.length ? (
            <FormStoreTable
              isEmptyResults={
                !formStoreRecords.length && !isLoading && !loadError
              }
              getTableProps={getTableProps}
              getTableBodyProps={getTableBodyProps}
              headerGroups={headerGroups}
              rows={rows}
              prepareRow={prepareRow}
              onChangeFilters={onChangeFilters}
            />
          ) : (
            <NoResourcesYet
              IconComponent={SettingsIcon}
              title="No Columns Visible"
              gutterBottom
            >
              It looks like you have hidden all of the available columns. Please
              enable at least one column to view submissions.
            </NoResourcesYet>
          )}

          {isLoading && (
            <LoadingWithMessage message="Loading more records..." />
          )}

          {loadError && (
            <>
              <ErrorMessage
                title="Error Retrieving Submissions"
                gutterBottom
                gutterTop
              >
                {loadError.message}
              </ErrorMessage>
              <Grid container justifyContent="center">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => onTryAgain()}
                >
                  Try Again
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default React.memo(FormStoreContainer)
