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
    expect(updatedState).toEqual(initialState)
  })

  it('should update state to latest version if hiddenColumns is undefined by adding all hidden columns', () => {
    const initialState: FormTableState = {
      formId: 1,
    }
    const updatedState = getVersionedFormTableState(initialState)
    expect(updatedState).toEqual({
      ...initialState,
      hiddenColumns: [
        'SUBMISSION_ID',
        'EXTERNAL_ID',
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
        'COMPLETED_AT',
      ],
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
      hiddenColumns: [
        'EXTERNAL_ID',
        'TASK',
        'TASK_ACTION',
        'TASK_GROUP',
        'TASK_GROUP_INSTANCE',
        'COMPLETED_AT',
      ],
      defaultHiddenColumnsVersion: latestStateVersion,
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
      hiddenColumns: [
        'SUBMISSION_ID',
        'EXTERNAL_ID',
        'TASK',
        'FORM_COLUMN',
        'COMPLETED_AT',
      ],
      defaultHiddenColumnsVersion: latestStateVersion,
    })
  })
})
