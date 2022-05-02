import * as React from 'react'
import { useHistory } from 'react-router-dom'
import querystring from 'query-string'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { formStoreService } from '@oneblink/apps'
import useInfiniteScrollDataLoad from '../../hooks/useInfiniteScrollDataLoad'
import useFormStoreTable from './table/useFormStoreTable'
import { Button, Grid } from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import { FormTypes } from '@oneblink/types'
import useSubmissionIdValidationMessage, {
  validateIsUUID,
} from '../../hooks/useSubmissionIdIsValid'
import ErrorMessage from '../messages/ErrorMessage'
import LoadingWithMessage from '../LoadingWithMessage'
import NoResourcesYet from '../messages/NoResourcesYet'
import FormStoreIcon from './display/FormStoreIcon'
import { FormStoreTableContext } from './useFormStoreTableContext'

export function FormStoreTableProvider({
  form,
  children,
}: {
  form: FormTypes.Form
  children: React.ReactNode
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

  const formStoreTable = useFormStoreTable({
    formStoreRecords,
    filters,
    onChangeFilters,
    submissionIdValidationMessage,
    form,
    onRefresh,
  })

  return (
    <FormStoreTableContext.Provider value={formStoreTable}>
      {children}
      {formStoreTable.visibleColumns.length ? (
        <>
          {!formStoreRecords.length && !isLoading && !loadError && (
            <NoResourcesYet
              IconComponent={FormStoreIcon}
              title="No Records Found..."
            >
              There are no Submissions matching your filters.
            </NoResourcesYet>
          )}
        </>
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

      {isLoading && <LoadingWithMessage message="Loading more records..." />}

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
              className="ob-form-store-try-again-button"
              variant="outlined"
              color="primary"
              onClick={() => onTryAgain()}
            >
              Try Again
            </Button>
          </Grid>
        </>
      )}
    </FormStoreTableContext.Provider>
  )
}
