import { FormStoreRecord } from '@oneblink/types/typescript/submissions'
import { TableState } from 'react-table'

export const defaultHiddenColumns = [
  'SUBMISSION_ID',
  'EXTERNAL_ID',
  'TASK',
  'TASK_ACTION',
  'TASK_GROUP',
  'TASK_GROUP_INSTANCE',
]

export type FormTableState = Partial<TableState<FormStoreRecord>> & {
  defaultHiddenColumnsVersion?: string
}

const removeUnhiddenDefaultColumns = (
  state: Record<string, unknown>,
  columnsSet: Set<string>,
) => {
  if (!Array.isArray(state.hiddenColumns)) {
    return
  }

  // Indices of the old default hidden columns array, update when creating new version
  for (let i = 0; i < 2; i++) {
    if (!state.hiddenColumns.includes(defaultHiddenColumns[i])) {
      columnsSet.delete(defaultHiddenColumns[i])
    }
  }

  return columnsSet
}

export const getVersionedFormTableState = (
  initialState: FormTableState,
): FormTableState | undefined => {
  const state = { ...initialState }
  if (
    state &&
    Array.isArray(state.hiddenColumns) &&
    state.defaultHiddenColumnsVersion !== 'V1'
  ) {
    const columnsSet = removeUnhiddenDefaultColumns(
      state,
      new Set([...defaultHiddenColumns, ...state.hiddenColumns]),
    )

    if (!columnsSet) {
      return
    }

    state.hiddenColumns = Array.from(columnsSet)
    state.defaultHiddenColumnsVersion = 'V1'
  }
  return state
}

export default getVersionedFormTableState
