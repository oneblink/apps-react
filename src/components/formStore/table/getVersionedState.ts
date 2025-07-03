import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { TableState } from 'react-table'

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

export type FormTableState = Partial<TableState<FormStoreRecord>> & {
  defaultHiddenColumnsVersion?: string
  formId: number
}

export const getVersionedFormTableState = (
  initialState: FormTableState,
): FormTableState => {
  const state = { ...initialState }
  // If there are no hidden columns yet, meaning it is a
  // brand new state, hide all default columns.
  if (!Array.isArray(state.hiddenColumns)) {
    state.hiddenColumns = defaultHiddenColumns.reduce<string[]>(
      (memo, defaultHiddenColumn) => {
        return [...memo, ...defaultHiddenColumn.hiddenColumns]
      },
      [],
    )
  } else if (state.defaultHiddenColumnsVersion !== latestStateVersion) {
    // If the state is not up to the latest version, find the next version
    // and add the new defaults
    let foundVersion = false
    const columnsSet = new Set<string>(state.hiddenColumns)
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

    state.hiddenColumns = Array.from(columnsSet)
  }

  state.defaultHiddenColumnsVersion = latestStateVersion

  return state
}

export default getVersionedFormTableState
