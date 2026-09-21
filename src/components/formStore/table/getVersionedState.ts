import { TableState, VisibilityState } from '@tanstack/react-table'
import { FormTypes } from '@oneblink/types'

const defaultHiddenColumns = [
  {
    version: undefined,
    hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID'],
  },
  {
    version: 'V1',
    hiddenColumns: ['TASK', 'TASK_ACTION', 'TASK_GROUP', 'TASK_GROUP_INSTANCE'],
  },
  {
    version: 'V2',
    hiddenColumns: ['COMPLETED_AT'],
  },
  {
    version: 'V3',
    hiddenColumns: (form: FormTypes.Form) => {
      const columns = []
      if (!form.schedulingEvents?.length) {
        columns.push(
          'CALENDAR_EVENT_TITLE',
          'CALENDAR_EVENT_CALENDAR_NAME',
          'CALENDAR_EVENT_DATE_TIME',
          'CALENDAR_EVENT_CANCELLED_REASON',
        )
      }
      if (!form.paymentEvents?.length) {
        columns.push(
          'PAYMENT_STATUS',
          'PAYMENT_PROVIDER_TRANSACTION_ID',
          'PAYMENT_PROVIDER_RECEIPT_NUMBER',
        )
      }
      return columns
    },
  },
]

export const latestStateVersion =
  defaultHiddenColumns[defaultHiddenColumns.length - 1].version

export type FormTableState = Partial<TableState> & {
  /** @deprecated The table state now uses columnVisibility instead */
  hiddenColumns?: string[]
  defaultHiddenColumnsVersion?: string
  formId: number
}

export const getVersionedFormTableState = ({
  form,
  initialState,
}: {
  form: FormTypes.Form
  initialState: FormTableState
}): FormTableState => {
  const state = { ...initialState }

  // carry over deprecated hiddenColumns to columnVisibility
  if (state.hiddenColumns?.length) {
    const columnVisibility: Record<string, boolean> = {}
    state.hiddenColumns.forEach((column) => {
      columnVisibility[column] = false
    })
    state.columnVisibility = columnVisibility
  }

  // If there are no hidden columns yet, meaning it is a
  // brand new state, hide all default columns.
  if (!state.columnVisibility) {
    state.columnVisibility = defaultHiddenColumns.reduce<VisibilityState>(
      (memo, defaultHiddenColumn) => {
        const hiddenColumns =
          typeof defaultHiddenColumn.hiddenColumns === 'function'
            ? defaultHiddenColumn.hiddenColumns(form)
            : defaultHiddenColumn.hiddenColumns

        hiddenColumns.forEach((column) => {
          memo[column] = false
        })
        return memo
      },
      {},
    )
  } else if (state.defaultHiddenColumnsVersion !== latestStateVersion) {
    // If the state is not up to the latest version, find the next version
    // and add the new defaults
    let foundVersion = false
    const columnsSet = new Set<string>(Object.keys(state.columnVisibility))
    for (const defaultHiddenColumn of defaultHiddenColumns) {
      if (defaultHiddenColumn.version === state.defaultHiddenColumnsVersion) {
        foundVersion = true
        continue
      }

      const hiddenColumns =
        typeof defaultHiddenColumn.hiddenColumns === 'function'
          ? defaultHiddenColumn.hiddenColumns(form)
          : defaultHiddenColumn.hiddenColumns

      if (foundVersion) {
        for (const hiddenColumn of hiddenColumns) {
          columnsSet.add(hiddenColumn)
        }
      }
    }

    state.columnVisibility = Array.from(columnsSet).reduce<VisibilityState>(
      (memo, column) => {
        return {
          ...memo,
          [column]: false,
        }
      },
      {},
    )
  }

  state.defaultHiddenColumnsVersion = latestStateVersion

  return state
}

export default getVersionedFormTableState
