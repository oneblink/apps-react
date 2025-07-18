import * as React from 'react'
import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import {
  CellProps,
  useFlexLayout,
  useResizeColumns,
  useTable,
} from 'react-table'
import { format } from 'date-fns'
import generateColumns from './generateColumns'
import ActionedByTableCell from './ActionedByTableCell'
import TableCellCopyButton from './TableCellCopyButton'
import { FormTypes } from '@oneblink/types'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'
import { formStoreService, localisationService } from '@oneblink/apps'
import { FormStoreElementsContext } from '../OneBlinkFormStoreProvider'
import getVersionedFormTableState, { FormTableState } from './getVersionedState'

const defaultColumn = {
  minWidth: 150,
  width: 225,
}

const localStorageKey = (formId: number) =>
  `REACT_TABLE_STATE_FORM_STORE_${formId}`

export default function useFormStoreTable({
  form,
  formStoreRecords,
  parameters,
  onChangeParameters,
  onRefresh,
  submissionIdValidationMessage,
}: {
  formStoreRecords: FormStoreRecord[]
  form: FormTypes.Form
  parameters: formStoreService.FormStoreParameters
  onChangeParameters: OnChangeFilters<formStoreService.FormStoreParameters>
  onRefresh: () => void
  submissionIdValidationMessage?: string
}) {
  // Resets parameters on form change
  React.useEffect(() => {
    onChangeParameters(
      (currentParameters) => ({
        ...currentParameters,
        filters: undefined,
        sorting: [
          {
            property: 'dateTimeSubmitted',
            direction: 'descending',
          },
        ],
      }),
      false,
    )
  }, [form, onChangeParameters])

  const formElements = React.useContext(FormStoreElementsContext)
  const columns = React.useMemo(() => {
    return generateColumns({
      sorting: parameters.sorting,
      filters: parameters.filters,
      unwindRepeatableSets: parameters.unwindRepeatableSets,
      formElements,
      parentElementNames: [],
      onChangeParameters,
      allowCopy: true,
      initialColumns: [
        {
          id: 'COMPLETED_AT',
          headerText: 'Completion Date Time',
          sorting: {
            property: 'dateTimeCompleted',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'dateTimeCompleted',
            )?.direction,
          },
          filter: {
            type: 'DATETIME',
            value: parameters.filters?.dateTimeCompleted as
              | { $gte?: string; $lte?: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    dateTimeCompleted: newValue,
                  },
                }),
                false,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => {
            if (!formStoreRecord.dateTimeCompleted) {
              return null
            }
            const text = format(
              new Date(formStoreRecord.dateTimeCompleted),
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
          id: 'SUBMITTED_AT',
          headerText: 'Submission Date Time',
          sorting: {
            property: 'dateTimeSubmitted',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'dateTimeSubmitted',
            )?.direction,
          },
          filter: {
            type: 'DATETIME',
            value: parameters.filters?.dateTimeSubmitted as
              | { $gte?: string; $lte?: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    dateTimeSubmitted: newValue,
                  },
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
            value: parameters.filters?.submittedBy as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    submittedBy: newValue,
                  },
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
            value: parameters.filters?.submissionId as
              | { $eq: string }
              | undefined,
            validationMessage: submissionIdValidationMessage,
            isInvalid: !!submissionIdValidationMessage,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    submissionId: newValue,
                  },
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
            direction: parameters.sorting?.find(
              ({ property }) => property === 'externalId',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: parameters.filters?.externalId as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    externalId: newValue,
                  },
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
        {
          id: 'TASK_GROUP',
          headerText: 'Task Group',
          sorting: {
            property: 'taskGroup.name',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'taskGroup.name',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: parameters.filters?.taskGroup?.name as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    taskGroup: newValue
                      ? {
                          name: newValue,
                        }
                      : undefined,
                  },
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.taskGroup?.name}
              {formStoreRecord.taskGroup?.name && (
                <TableCellCopyButton text={formStoreRecord.taskGroup?.name} />
              )}
            </>
          ),
        },
        {
          id: 'TASK_GROUP_INSTANCE',
          headerText: 'Task Group Instance',
          sorting: {
            property: 'taskGroupInstance.label',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'taskGroupInstance.label',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: parameters.filters?.taskGroupInstance?.label as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    taskGroupInstance: newValue
                      ? {
                          label: newValue,
                        }
                      : undefined,
                  },
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.taskGroupInstance?.label}
              {formStoreRecord.taskGroupInstance?.label && (
                <TableCellCopyButton
                  text={formStoreRecord.taskGroupInstance?.label}
                />
              )}
            </>
          ),
        },
        {
          id: 'TASK',
          headerText: 'Task',
          sorting: {
            property: 'task.name',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'task.name',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: parameters.filters?.task?.name as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    task: newValue
                      ? {
                          name: newValue,
                        }
                      : undefined,
                  },
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.task?.name}
              {formStoreRecord.task?.name && (
                <TableCellCopyButton text={formStoreRecord.task?.name} />
              )}
            </>
          ),
        },
        {
          id: 'TASK_ACTION',
          headerText: 'Task Action',
          sorting: {
            property: 'taskAction.label',
            direction: parameters.sorting?.find(
              ({ property }) => property === 'taskAction.label',
            )?.direction,
          },
          filter: {
            type: 'TEXT',
            value: parameters.filters?.taskAction?.label as
              | { $regex: string }
              | undefined,
            onChange: (newValue) => {
              onChangeParameters(
                (currentParameters) => ({
                  ...currentParameters,
                  filters: {
                    ...currentParameters.filters,
                    taskAction: newValue
                      ? {
                          label: newValue,
                        }
                      : undefined,
                  },
                }),
                true,
              )
            },
          },
          Cell: ({
            row: { original: formStoreRecord },
          }: CellProps<FormStoreRecord>) => (
            <>
              {formStoreRecord.taskAction?.label}
              {formStoreRecord.taskAction?.label && (
                <TableCellCopyButton text={formStoreRecord.taskAction?.label} />
              )}
            </>
          ),
        },
      ],
    })
  }, [
    formElements,
    onChangeParameters,
    parameters,
    submissionIdValidationMessage,
  ])

  const [initialState] = React.useState<FormTableState | undefined>(() => {
    const text = localStorage.getItem(localStorageKey(form.id))
    return getVersionedFormTableState(
      text
        ? JSON.parse(text)
        : {
            formId: form.id,
          },
    )
  })

  const table = useTable(
    {
      columns,
      data: formStoreRecords,
      defaultColumn,
      autoResetHiddenColumns: false,
      autoResetResize: false,
      initialState,
    },
    useFlexLayout,
    useResizeColumns,
  )

  React.useEffect(() => {
    if ((table.state as FormTableState).formId !== form.id) {
      // If the form id changes, do not save the state from the previous form over the that of the new form
      return
    }
    if (!table.state.columnResizing.isResizingColumn) {
      const storageKey = localStorageKey(form.id)
      localStorage.setItem(storageKey, JSON.stringify(table.state))
    }
  }, [form.id, table.state])

  return {
    ...table,
    form,
    parameters,
    onChangeParameters,
    onRefresh,
    submissionIdValidationMessage,
  } as const
}
