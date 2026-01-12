import * as React from 'react'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { formStoreService, localisationService } from '../../../apps'
import {
  useReactTable,
  getCoreRowModel,
  OnChangeFn,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import generateColumns from './generateColumns'
import ActionedByTableCell from './ActionedByTableCell'
import TableCellCopyButton from './TableCellCopyButton'
import { OnChangeFilters } from '../../../hooks/useInfiniteScrollDataLoad'
import { FormStoreElementsContext } from '../OneBlinkFormStoreProvider'
import getVersionedFormTableState, { FormTableState } from './getVersionedState'

const defaultColumn = {
  minSize: 150,
  size: 225,
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
  formStoreRecords: SubmissionTypes.FormStoreRecord[]
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
    return generateColumns<SubmissionTypes.FormStoreRecord>({
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
          header: 'Completion Date Time',
          meta: {
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
          },

          cell: ({ row: { original: formStoreRecord } }) => {
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
          header: 'Submission Date Time',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => {
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
          header: 'Submitted By',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
            <ActionedByTableCell
              userProfile={formStoreRecord.user}
              developerKey={formStoreRecord.key}
              variant="outlined"
            />
          ),
        },
        {
          id: 'SUBMISSION_ID',
          header: 'Submission Id',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
            <>
              {formStoreRecord.submissionId}
              <TableCellCopyButton text={formStoreRecord.submissionId} />
            </>
          ),
        },
        {
          id: 'EXTERNAL_ID',
          header: 'External Id',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
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
          header: 'Task Group',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
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
          header: 'Task Group Instance',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
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
          header: 'Task',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
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
          header: 'Task Action',
          meta: {
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
          },
          cell: ({ row: { original: formStoreRecord } }) => (
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

  const transformedSorting = React.useMemo(() => {
    return parameters.sorting?.reduce<SortingState>(
      (memo, { property, direction }) => {
        const column = columns.find(
          (column) => column.meta?.sorting?.property === property,
        )
        if (column?.id) {
          memo.push({
            id: column.id,
            desc: direction === 'descending',
          })
        }
        return memo
      },
      [],
    )
  }, [parameters.sorting, columns])

  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updaterOrValue) => {
      const sortingState =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(
              // transform the parameters sorting state to the tanstack sorting state
              parameters.sorting?.reduce<SortingState>(
                (memo, { property, direction }) => {
                  const column = columns.find(
                    (column) => column.meta?.sorting?.property === property,
                  )
                  if (column?.id) {
                    memo.push({
                      id: column.id,
                      desc: direction === 'descending',
                    })
                  }
                  return memo
                },
                [],
              ) ?? [],
            )
          : updaterOrValue
      onChangeParameters(
        (currentParameters) => ({
          ...currentParameters,
          // transform the tanstack sorting state to the parameters sorting state
          sorting: sortingState.reduce<
            NonNullable<formStoreService.FormStoreParameters['sorting']>
          >((memo, { id, desc }) => {
            const column = columns.find((column) => column.id === id)
            if (column?.meta?.sorting?.property) {
              memo.push({
                property: column.meta.sorting.property,
                direction: desc ? 'descending' : 'ascending',
              })
            }
            return memo
          }, []),
        }),
        false,
      )
    },
    [onChangeParameters, parameters.sorting, columns],
  )

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility || {})

  const table = useReactTable({
    meta: {
      defaultHiddenColumnsVersion: initialState?.defaultHiddenColumnsVersion,
      formId: form.id,
    },
    columns,
    data: formStoreRecords,
    defaultColumn,
    state: {
      sorting: transformedSorting,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange,
    manualFiltering: true,
    initialState,
    getCoreRowModel: getCoreRowModel<SubmissionTypes.FormStoreRecord>(),
  })

  const state = table.getState()

  React.useEffect(() => {
    if (table.options.meta?.formId !== form.id) {
      // If the form id changes, do not save the state from the previous form over the that of the new form
      return
    }
    if (!state.columnSizing.isResizingColumn) {
      const storageKey = localStorageKey(form.id)
      const augmentedState = {
        ...state,
        hiddenColumns: Object.keys(state.columnVisibility),
        formId: table.options.meta?.formId,
      }
      localStorage.setItem(storageKey, JSON.stringify(augmentedState))
    }
  }, [form.id, state, table.options.meta?.formId])

  return {
    ...table,
    form,
    parameters,
    onChangeParameters,
    onRefresh,
    submissionIdValidationMessage,
  } as const
}
