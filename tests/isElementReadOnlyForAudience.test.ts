import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import isElementReadOnlyForAudience from '../src/services/isElementReadOnlyForAudience'

function textElement(
  id: string,
  options: Partial<FormTypes.TextElement> = {},
): FormTypes.TextElement {
  return {
    id,
    name: id,
    label: id,
    type: 'text',
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
    ...options,
  }
}

describe('isElementReadOnlyForAudience', () => {
  test('never locks elements for submitters', () => {
    expect(isElementReadOnlyForAudience(textElement('locked'), 'SUBMITTER')).toBe(
      false,
    )
  })

  test('locks elements not configured for approver editing', () => {
    expect(isElementReadOnlyForAudience(textElement('locked'), 'APPROVER')).toBe(
      true,
    )
  })

  test('leaves approver editable elements interactive', () => {
    expect(
      isElementReadOnlyForAudience(
        textElement('editable', {
          approverEditability: { type: 'ALL_STEPS' },
        }),
        'APPROVER',
      ),
    ).toBe(false)
  })

  test('keeps a nested form interactive when a descendant is editable', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [
        textElement('nested-locked'),
        textElement('nested-editable', {
          approverEditability: { type: 'ALL_STEPS' },
        }),
      ],
    } as FormTypes.FormFormElement

    expect(isElementReadOnlyForAudience(nestedForm, 'APPROVER')).toBe(false)
  })

  test('locks a nested form with no editable descendants', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [textElement('nested-locked')],
    } as FormTypes.FormFormElement

    expect(isElementReadOnlyForAudience(nestedForm, 'APPROVER')).toBe(true)
  })

  test('treats info pages the same as nested forms', () => {
    const infoPage = {
      id: 'info-page',
      name: 'infoPage',
      label: 'Info page',
      type: 'infoPage',
      conditionallyShow: false,
      formId: 1,
      elements: [
        textElement('nested-editable', {
          approverEditability: { type: 'ALL_STEPS' },
        }),
      ],
    } as FormTypes.FormFormElement

    expect(isElementReadOnlyForAudience(infoPage, 'APPROVER')).toBe(false)
  })
})
