import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import {
  checkAreLookupsDisallowed,
  checkIsFormElementEditable,
  checkIsFormElementReadOnly,
} from '../src/utils/read-only-form-elements'

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

describe('checkIsFormElementReadOnly()', () => {
  test('uses the element readOnly flag when no editable ids are provided', () => {
    expect(
      checkIsFormElementReadOnly(textElement('locked', { readOnly: true })),
    ).toBe(true)
    expect(checkIsFormElementReadOnly(textElement('editable'))).toBe(false)
  })

  test('locks every element when a whitelist is provided and the id is absent', () => {
    expect(checkIsFormElementReadOnly(textElement('locked'), {})).toBe(false)
    expect(
      checkIsFormElementReadOnly(textElement('locked'), {
        editableFormElementIds: ['another-element'],
      }),
    ).toBe(true)
  })

  test('unlocks an id in the whitelist, including over element readOnly and form read-only', () => {
    expect(
      checkIsFormElementReadOnly(
        textElement('editable', { readOnly: true }),
        {
          isFormReadOnly: true,
          editableFormElementIds: ['editable'],
        },
      ),
    ).toBe(false)
  })

  test('locks all elements when the form is read-only and no whitelist is provided', () => {
    expect(
      checkIsFormElementReadOnly(textElement('editable'), {
        isFormReadOnly: true,
      }),
    ).toBe(true)
  })

  test('locks an element when read-only is inherited', () => {
    expect(
      checkIsFormElementReadOnly(textElement('editable'), {
        isInheritedReadOnly: true,
      }),
    ).toBe(true)
  })

  test('an editable id overrides inherited read-only', () => {
    expect(
      checkIsFormElementReadOnly(textElement('editable'), {
        isInheritedReadOnly: true,
        editableFormElementIds: ['editable'],
      }),
    ).toBe(false)
  })
})

describe('checkAreLookupsDisallowed()', () => {
  test('allows lookups on definition-level read-only fields when no whitelist is provided', () => {
    expect(
      checkAreLookupsDisallowed(textElement('locked', { readOnly: true })),
    ).toBe(false)
  })

  test('blocks lookups when the whole form is read-only and no whitelist is provided', () => {
    expect(
      checkAreLookupsDisallowed(textElement('locked', { readOnly: true }), {
        isFormReadOnly: true,
      }),
    ).toBe(true)
  })

  test('blocks lookups for ids absent from a whitelist', () => {
    expect(
      checkAreLookupsDisallowed(textElement('locked'), {
        editableFormElementIds: ['another-element'],
      }),
    ).toBe(true)
  })

  test('allows lookups for a whitelisted id, including on a read-only form', () => {
    expect(
      checkAreLookupsDisallowed(textElement('editable', { readOnly: true }), {
        isFormReadOnly: true,
        editableFormElementIds: ['editable'],
      }),
    ).toBe(false)
  })
})

describe('checkIsFormElementEditable()', () => {
  test('treats every element as editable when no whitelist is provided', () => {
    expect(
      checkIsFormElementEditable(
        textElement('locked', { readOnly: true }),
      ),
    ).toBe(true)
  })

  test('is true only for listed ids when a whitelist is provided', () => {
    expect(
      checkIsFormElementEditable(textElement('locked'), ['another-element']),
    ).toBe(false)
    expect(
      checkIsFormElementEditable(textElement('editable'), ['editable']),
    ).toBe(true)
  })

  test('keeps a nested form editable when a descendant is listed', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [textElement('nested-locked'), textElement('nested-editable')],
    } as FormTypes.FormFormElement

    expect(
      checkIsFormElementEditable(nestedForm, ['nested-editable']),
    ).toBe(true)
  })

  test('is false for a nested form with no listed descendants', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [textElement('nested-locked')],
    } as FormTypes.FormFormElement

    expect(
      checkIsFormElementEditable(nestedForm, ['another-element']),
    ).toBe(false)
  })

  test('treats info pages the same as nested forms', () => {
    const infoPage = {
      id: 'info-page',
      name: 'infoPage',
      label: 'Info page',
      type: 'infoPage',
      conditionallyShow: false,
      formId: 1,
      elements: [textElement('nested-editable')],
    } as FormTypes.FormFormElement

    expect(
      checkIsFormElementEditable(infoPage, ['nested-editable']),
    ).toBe(true)
  })
})
