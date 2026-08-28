import { FormTypes } from '@oneblink/types'
import { describe, expect, test } from 'vitest'
import resolveFormElementReadOnly from '../src/services/resolveFormElementReadOnly'

const textElement = {
  id: 'text',
  type: 'text',
  name: 'text',
  label: 'Text',
  required: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
} as FormTypes.TextElement

describe('resolveFormElementReadOnly()', () => {
  test('preserves configured read-only for form users', () => {
    expect(
      resolveFormElementReadOnly(
        { ...textElement, readOnly: true },
        'SUBMITTER',
      ),
    ).toBe(true)
  })

  test('locks an element that is not editable by approvers', () => {
    expect(resolveFormElementReadOnly(textElement, 'APPROVER')).toBe(true)
  })

  test('allows an approver-editable element for approvers', () => {
    expect(
      resolveFormElementReadOnly(
        {
          ...textElement,
          approverEditability: { type: 'ALL_STEPS' },
        },
        'APPROVER',
      ),
    ).toBe(false)
  })

  test('approver editability overrides configured read-only for approvers', () => {
    expect(
      resolveFormElementReadOnly(
        {
          ...textElement,
          readOnly: true,
          approverEditability: { type: 'ALL_STEPS' },
        },
        'APPROVER',
      ),
    ).toBe(false)
  })

  test('configured read-only still applies for submitters when approver-editable', () => {
    expect(
      resolveFormElementReadOnly(
        {
          ...textElement,
          readOnly: true,
          approverEditability: { type: 'ALL_STEPS' },
        },
        'SUBMITTER',
      ),
    ).toBe(true)
  })
})
