import { ApprovalTypes } from '@oneblink/types'
import { describe, expect, test } from 'vitest'
import getApproverEditableFormElementIds from '../../../src/services/form-validation/getApproverEditableFormElementIds'

describe('getApproverEditableFormElementIds()', () => {
  test('collects unique editable element ids from standard and concurrent steps', () => {
    const approvalSteps = [
      {
        type: 'STANDARD',
        label: 'Standard',
        group: 'Group 1',
        editableFormElementIds: ['first', 'shared'],
      },
      {
        type: 'CONCURRENT',
        nodes: [
          {
            label: 'Concurrent 1',
            group: 'Group 2',
            editableFormElementIds: ['second', 'shared'],
          },
          {
            label: 'Concurrent 2',
            group: 'Group 3',
          },
        ],
      },
    ] satisfies ApprovalTypes.FormApprovalFlowStep[]

    expect(getApproverEditableFormElementIds(approvalSteps)).toEqual([
      'first',
      'shared',
      'second',
    ])
  })

  test('returns no ids when approval steps are omitted', () => {
    expect(getApproverEditableFormElementIds(undefined)).toEqual([])
  })
})
