import { TableState, VisibilityState } from '@tanstack/react-table'

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
]

export const latestStateVersion =
  defaultHiddenColumns[defaultHiddenColumns.length - 1].version

export type FormTableState = Partial<TableState> & {
  defaultHiddenColumnsVersion?: string
  formId: number
}

export const getVersionedFormTableState = (
  initialState: FormTableState,
): FormTableState => {
  const state = { ...initialState }

  // If there are no hidden columns yet, meaning it is a
  // brand new state, hide all default columns.
  if (!state.columnVisibility) {
    state.columnVisibility = defaultHiddenColumns.reduce<VisibilityState>(
      (memo, defaultHiddenColumn) => {
        defaultHiddenColumn.hiddenColumns.forEach((column) => {
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

      if (foundVersion) {
        for (const hiddenColumn of defaultHiddenColumn.hiddenColumns) {
          columnsSet.add(hiddenColumn)
        }
      }
    }

    state.columnVisibility = Array.from(columnsSet).reduce<VisibilityState>(
      (memo, column) => {
        return {
          ...memo,
          [column]: true,
        }
      },
      {},
    )
  }

  state.defaultHiddenColumnsVersion = latestStateVersion

  return state
}

export default getVersionedFormTableState
