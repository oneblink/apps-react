import { ApprovalTypes, FormTypes } from '@oneblink/types'
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

  test('includes every descendant when a form element is editable', () => {
    const approvalSteps = [
      {
        type: 'STANDARD',
        label: 'Standard',
        group: 'Group 1',
        editableFormElementIds: ['nested-form'],
      },
    ] satisfies ApprovalTypes.FormApprovalFlowStep[]
    const formElements = [
      {
        id: 'nested-form',
        name: 'nestedForm',
        type: 'form',
        formId: 2,
        conditionallyShow: false,
        elements: [
          {
            id: 'nested-text',
            name: 'nestedText',
            label: 'Nested text',
            type: 'text',
            conditionallyShow: false,
            isDataLookup: false,
            isElementLookup: false,
          },
          {
            id: 'nested-set',
            name: 'nestedSet',
            label: 'Nested set',
            type: 'repeatableSet',
            conditionallyShow: false,
            elements: [
              {
                id: 'set-text',
                name: 'setText',
                label: 'Set text',
                type: 'text',
                conditionallyShow: false,
                isDataLookup: false,
                isElementLookup: false,
              },
            ],
          },
        ],
      },
    ] as FormTypes.FormElement[]

    expect(
      getApproverEditableFormElementIds(approvalSteps, formElements),
    ).toEqual(['nested-form', 'nested-text', 'nested-set', 'set-text'])
  })
})
