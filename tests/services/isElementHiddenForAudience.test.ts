import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import isElementHiddenForAudience from '../../src/services/isElementHiddenForAudience'

describe('isElementHiddenForAudience()', () => {
  test('is not hidden when isHidden is omitted', () => {
    expect(isElementHiddenForAudience({}, 'FORM_COMPLETER')).toBe(false)
    expect(isElementHiddenForAudience({}, 'APPROVER')).toBe(false)
  })

  test('is not hidden when isHidden is false', () => {
    expect(
      isElementHiddenForAudience({ isHidden: false }, 'FORM_COMPLETER'),
    ).toBe(false)
    expect(isElementHiddenForAudience({ isHidden: false }, 'APPROVER')).toBe(
      false,
    )
  })

  test('is hidden from all audiences when isHidden is true and hiddenFrom is omitted', () => {
    expect(
      isElementHiddenForAudience({ isHidden: true }, 'FORM_COMPLETER'),
    ).toBe(true)
    expect(isElementHiddenForAudience({ isHidden: true }, 'APPROVER')).toBe(
      true,
    )
  })

  test('is hidden from all audiences when isHidden is true and hiddenFrom is empty', () => {
    expect(
      isElementHiddenForAudience(
        { isHidden: true, hiddenFrom: [] },
        'FORM_COMPLETER',
      ),
    ).toBe(true)
    expect(
      isElementHiddenForAudience({ isHidden: true, hiddenFrom: [] }, 'APPROVER'),
    ).toBe(true)
  })

  test('is hidden from form completers only', () => {
    const element = {
      isHidden: true,
      hiddenFrom: [
        'FORM_COMPLETER',
      ] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'FORM_COMPLETER')).toBe(true)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(false)
  })

  test('is hidden from approvers only', () => {
    const element = {
      isHidden: true,
      hiddenFrom: ['APPROVER'] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'FORM_COMPLETER')).toBe(false)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(true)
  })

  test('is hidden from both audiences when both are listed', () => {
    const element = {
      isHidden: true,
      hiddenFrom: [
        'FORM_COMPLETER',
        'APPROVER',
      ] as FormTypes.FormElementHiddenFromAudience[],
    }
    expect(isElementHiddenForAudience(element, 'FORM_COMPLETER')).toBe(true)
    expect(isElementHiddenForAudience(element, 'APPROVER')).toBe(true)
  })
})
