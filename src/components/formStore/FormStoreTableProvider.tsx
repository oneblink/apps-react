import * as React from 'react'
import { useHistory } from 'react-router-dom'
import querystring from 'query-string'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { formStoreService } from '@oneblink/apps'
import useInfiniteScrollDataLoad from '../../hooks/useInfiniteScrollDataLoad'
import useFormStoreTable from './table/useFormStoreTable'
import { Button, Collapse, Grid } from '@mui/material'
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
    filters: parameters,
    onChangeFilters: onChangeParameters,
    nextOffset,
  } = useInfiniteScrollDataLoad<
    formStoreService.FormStoreParameters,
    FormStoreRecord
  >({
    limit: 50,
    isManual: true,
    debounceSearchMs: 1000,
    onDefaultFilters: React.useCallback((query) => {
      let defaultParameters: formStoreService.FormStoreParameters = {}
      try {
        if (typeof query.parameters === 'string') {
          defaultParameters = JSON.parse(query.parameters)
        }
      } catch (error) {
        console.warn('Could not parse filter as JSON', error)
      }
      if (!defaultParameters.sorting) {
        defaultParameters.sorting = [
          { property: 'dateTimeSubmitted', direction: 'descending' },
        ]
      }
      return defaultParameters
    }, []),
    onSearch: React.useCallback(
      async (currentParameters, paging, abortSignal) => {
        // Exclude all search parameters if searching
        // for a specific submission using an identifier
        const filters = currentParameters.filters?.submissionId
          ? {
              submissionId: currentParameters.filters.submissionId,
            }
          : currentParameters.filters
        const result = await formStoreService.searchFormStoreRecords(
          {
            ...currentParameters,
            paging,
            formId: form.id,
            filters,
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
      (currentParameters: formStoreService.FormStoreParameters) => {
        return validateIsUUID(currentParameters.filters?.submissionId?.$eq)
      },
      [],
    ),
  })

  React.useEffect(() => {
    history.replace({
      search: querystring.stringify({
        parameters: JSON.stringify(parameters),
      }),
    })
  }, [history, parameters])

  const submissionIdValidationMessage = useSubmissionIdValidationMessage(
    parameters.filters?.submissionId?.$eq,
  )

  const formStoreTable = useFormStoreTable({
    formStoreRecords,
    parameters,
    onChangeParameters,
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

      <Collapse in={!!isLoading}>
        <div
          className={
            isLoading === 'INITIAL'
              ? 'ob-form-store-loading-initial'
              : 'ob-form-store-loading-more'
          }
        >
          <LoadingWithMessage message="Loading more records..." />
        </div>
      </Collapse>

      {loadError && (
        <>
          <ErrorMessage
            title="Error Retrieving Submissions"
            gutterBottom
            gutterTop
          >
            {loadError.message}
          </ErrorMessage>
        </>
      )}

      {!!nextOffset && (
        <Grid container justifyContent="center">
          <Button
            className="ob-form-store-try-again-button"
            variant="outlined"
            color="primary"
            disabled={!!isLoading}
            onClick={() => onTryAgain(nextOffset)}
          >
            {loadError ? 'Try Again' : 'Load More'}
          </Button>
        </Grid>
      )}
    </FormStoreTableContext.Provider>
  )
}
