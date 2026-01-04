import { expect, it, describe } from 'vitest'
import getVersionedFormTableState, {
  FormTableState,
  latestStateVersion,
} from '../../../src/components/formStore/table/getVersionedState'

describe('getVersionedFormTableState', () => {
  it('should return the same state if defaultHiddenColumnsVersion is the latest', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['FORM_COLUMN'],
      defaultHiddenColumnsVersion: latestStateVersion,
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      ...initialState,
      columnVisibility: { FORM_COLUMN: false },
    })
  })

  it('should update state to latest version if hiddenColumns is undefined by adding all hidden columns', () => {
    const initialState: FormTableState = {
      formId: 1,
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      ...initialState,
      columnVisibility: {
        SUBMISSION_ID: false,
        EXTERNAL_ID: false,
        TASK: false,
        TASK_ACTION: false,
        TASK_GROUP: false,
        TASK_GROUP_INSTANCE: false,
        COMPLETED_AT: false,
      },
      defaultHiddenColumnsVersion: latestStateVersion,
    })
  })

  it('should update state to latest version if defaultHiddenColumnsVersion is undefined but not add in anything from initial version if hidden columns has been defined', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['EXTERNAL_ID'],
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      ...initialState,
      hiddenColumns: ['EXTERNAL_ID'],
      defaultHiddenColumnsVersion: latestStateVersion,
      columnVisibility: {
        EXTERNAL_ID: false,
        TASK: false,
        TASK_ACTION: false,
        TASK_GROUP: false,
        TASK_GROUP_INSTANCE: false,
        COMPLETED_AT: false,
      },
    })
  })

  it('should add default hidden columns from V2 but not change columns from V1 if defaultHiddenColumnsVersion is V1', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'FORM_COLUMN'],
      defaultHiddenColumnsVersion: 'V1',
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      ...initialState,
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'FORM_COLUMN'],
      defaultHiddenColumnsVersion: latestStateVersion,
      columnVisibility: {
        SUBMISSION_ID: false,
        EXTERNAL_ID: false,
        TASK: false,
        FORM_COLUMN: false,
        COMPLETED_AT: false,
      },
    })
  })
})
