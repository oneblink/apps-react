import getVersionedFormTableState from '../../../src/components/formStore/table/getVersionedState'

describe('getVersionedFormTableState', () => {
  it('should return the same state if defaultHiddenColumnsVersion is V1', () => {
    const initialState = {
      hiddenColumns: [
        'SUBMISSION_ID',
        'EXTERNAL_ID',
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
        'FORM_COLUMN',
      ],
      defaultHiddenColumnsVersion: 'V1',
    }
    expect(getVersionedFormTableState(initialState)).toEqual(initialState)
  })

  it('should update state if defaultHiddenColumnsVersion is undefined', () => {
    const initialState = {
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID'],
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      hiddenColumns: [
        'SUBMISSION_ID',
        'EXTERNAL_ID',
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
      ],
      defaultHiddenColumnsVersion: 'V1',
    })
  })

  it('should add default hidden columns on version mismatch', () => {
    const initialState = {
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'FORM_COLUMN'],
      defaultHiddenColumnsVersion: 'V0',
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      hiddenColumns: [
        'SUBMISSION_ID',
        'EXTERNAL_ID',
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
        'FORM_COLUMN',
      ],
      defaultHiddenColumnsVersion: 'V1',
    })
  })

  it('should maintain hidden columns from previous version', () => {
    const initialState = {
      hiddenColumns: [],
      defaultHiddenColumnsVersion: 'V0',
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      hiddenColumns: [
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
      ],
      defaultHiddenColumnsVersion: 'V1',
    })
  })
})
