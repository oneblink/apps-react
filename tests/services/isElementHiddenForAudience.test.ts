import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import isElementHiddenForAudience from '../../src/services/isElementHiddenForAudience'

describe('isElementHiddenForAudience()', () => {
  test('is not hidden when isHidden is omitted', () => {
    expect(isElementHiddenForAudience({}, 'SUBMITTER')).toBe(false)
    expect(isElementHiddenForAudience({}, 'APPROVER')).toBe(false)
  })

  test('is not hidden when isHidden is false', () => {
    expect(
      isElementHiddenForAudience({ isHidden: false }, 'SUBMITTER'),
    ).toBe(false)
    expect(isElementHiddenForAudience({ isHidden: false }, 'APPROVER')).toBe(
      false,
    )
  })

  test('is hidden from all audiences when isHidden is true and hiddenFrom is omitted', () => {
    expect(
      isElementHiddenForAudience({ isHidden: true }, 'SUBMITTER'),
    ).toBe(true)
    expect(isElementHiddenForAudience({ isHidden: true }, 'APPROVER')).toBe(
      true,
    )
  })

  test('is hidden from all audiences when isHidden is true and hiddenFrom is empty', () => {
    expect(
      isElementHiddenForAudience(
        { isHidden: true, hiddenFrom: [] },
        'SUBMITTER',
      ),
    ).toBe(true)
    expect(
      isElementHiddenForAudience({ isHidden: true, hiddenFrom: [] }, 'APPROVER'),
    ).toBe(true)
  })

  test('is hidden from submitters only', () => {
    const element = {
      isHidden: true,
      hiddenFrom: [
        'SUBMITTER',
      ] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'SUBMITTER')).toBe(true)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(false)
  })

  test('is hidden from approvers only', () => {
    const element = {
      isHidden: true,
      hiddenFrom: ['APPROVER'] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'SUBMITTER')).toBe(false)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(true)
  })

  test('is hidden from both audiences when both are listed', () => {
    const element = {
      isHidden: true,
      hiddenFrom: [
        'SUBMITTER',
        'APPROVER',
      ] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'SUBMITTER')).toBe(true)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(true)
  })
})
