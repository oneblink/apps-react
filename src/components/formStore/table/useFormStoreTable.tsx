import * as React from 'react'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import {
  CellProps,
  useFlexLayout,
  useResizeColumns,
  useTable,
  TableState,
} from 'react-table'
import { format } from 'date-fns'
import generateColumns from './generateColumns'
import ActionedByTableCell from './ActionedByTableCell'
import TableCellCopyButton from './TableCellCopyButton'
import { FormTypes } from '@oneblink/types'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'
import { formStoreService, localisationService } from '@oneblink/apps'

const defaultColumn = {
  minWidth: 150,
  width: 225,
}

const localStorageKey = (formId: number) =>
  `REACT_TABLE_STATE_FORM_STORE_${formId}`

export default function FormStoreTable({
  form,
  formElements,
  formStoreRecords,
  filters,
  onChangeFilters,
  submissionIdValidationMessage,
}: {
  formStoreRecords: FormStoreRecord[]
  form: FormTypes.Form
  formElements: FormTypes.FormElementWithName[]
  filters: formStoreService.FormStoreFilters
  onChangeFilters: OnChangeFilters<formStoreService.FormStoreFilters>
  submissionIdValidationMessage?: string
}) {
  const columns = React.useMemo(() => {
    return generateColumns({
      formElements,
      filters,
      parentElementNames: [],
      onChangeFilters,
      allowCopy: true,
      initialColumns: [
        {
          id: 'SUBMITTED_AT',
          headerText: 'Submission Date Time',
          sorting: {
            property: 'dateTimeSubmitted',
            direction: filters.sorting?.find(
              ({ property }) => property === 'dateTimeSubmitted',
            )?.direction,
          },
          filter: {
            type: 'DATETIME',
            value: filters.dateTimeSubmitted as
              | { $gte?: string; $lte?: string }
              | undefined,
            onChange: (newValue) => {
              onChangeFilters(
                (currentFilters) => ({
                  ...currentFilters,
                  dateTimeSubmitted: newValue,
                }),
                false,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => {
            const text = format(
              new Date(formStoreRecord.dateTimeSubmitted),
              localisationService.getDateFnsFormats().longDateTime,
            )
            return (
              <>
                {text}
                <TableCellCopyButton text={text} />
              </>
            )
          },
        },
        {
          id: 'SUBMITTED_BY',
          headerText: 'Submitted By',
          sorting: undefined,
          filter: {
            type: 'TEXT',
            value: filters.submittedBy as { $regex: string } | undefined,
            onChange: (newValue) => {
              onChangeFilters(
                (currentFilters) => ({
                  ...currentFilters,
                  submittedBy: newValue,
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <ActionedByTableCell
              userProfile={formStoreRecord.user}
              developerKey={formStoreRecord.key}
              variant="outlined"
            />
          ),
        },
        {
          id: 'SUBMISSION_ID',
          headerText: 'Submission Id',
          sorting: undefined,
          filter: {
            type: 'SUBMISSION_ID',
            value: filters.submissionId as { $eq: string } | undefined,
            validationMessage: submissionIdValidationMessage,
            isInvalid: !!submissionIdValidationMessage,
            onChange: (newValue) => {
              onChangeFilters(
                (currentFilters) => ({
                  ...currentFilters,
                  submissionId: newValue,
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.submissionId}
              <TableCellCopyButton text={formStoreRecord.submissionId} />
            </>
          ),
        },
        {
          id: 'EXTERNAL_ID',
          headerText: 'External Id',
          sorting: {
            property: 'externalId',
            direction: filters.sorting?.find(
              ({ property }) => property === 'externalId',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: filters.externalId as { $regex: string } | undefined,
            onChange: (newValue) => {
              onChangeFilters(
                (currentFilters) => ({
                  ...currentFilters,
                  externalId: newValue,
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.externalId}
              {formStoreRecord.externalId && (
                <TableCellCopyButton text={formStoreRecord.externalId} />
              )}
            </>
          ),
        },
      ],
    })
  }, [filters, formElements, onChangeFilters, submissionIdValidationMessage])

  const [initialState] = React.useState<Partial<TableState<FormStoreRecord>>>(
    () => {
      const text = localStorage.getItem(localStorageKey(form.id))
      if (text) {
        return JSON.parse(text)
      }
    },
  )

  const table = useTable(
    {
      columns,
      data: formStoreRecords,
      defaultColumn,
      autoResetHiddenColumns: false,
      autoResetResize: false,
      initialState: initialState
        ? initialState
        : { hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID'] },
    },
    useFlexLayout,
    useResizeColumns,
  )

  React.useEffect(() => {
    if (!table.state.columnResizing.isResizingColumn) {
      localStorage.setItem(
        localStorageKey(form.id),
        JSON.stringify(table.state),
      )
    }
  }, [form.id, table.state])

  return table
}
