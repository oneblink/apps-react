import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import validateSubmission from '../../../src/services/form-validation/validateSubmission'

function textElement(
  id: string,
  options: Partial<FormTypes.TextElement> = {},
): FormTypes.TextElement {
  return {
    id,
    name: id,
    label: id,
    type: 'text',
    required: true,
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
    ...options,
  }
}

const approverEditable = { type: 'ALL_STEPS' } as const

function validate(
  elements: FormTypes.FormElement[],
  submission: Record<string, unknown>,
  audience: FormTypes.FormElementHiddenFromAudience,
) {
  return validateSubmission({
    elements: elements as FormTypes.FormElementWithName[],
    submission,
    formElementsConditionallyShown: undefined,
    executedLookups: {},
    captchaType: 'CHECKBOX',
    isOffline: false,
    audience,
  })
}

describe('validateSubmission audience', () => {
  test('validates a locked required element for a submitter', () => {
    expect(validate([textElement('locked')], {}, 'SUBMITTER')).toEqual({
      locked: 'Please enter a value',
    })
  })

  test('skips a locked required element for an approver', () => {
    expect(validate([textElement('locked')], {}, 'APPROVER')).toBeUndefined()
  })

  test('validates an approver editable element for an approver', () => {
    expect(
      validate(
        [
          textElement('locked'),
          textElement('editable', { approverEditability: approverEditable }),
        ],
        {},
        'APPROVER',
      ),
    ).toEqual({
      editable: 'Please enter a value',
    })
  })

  test('validates an approver editable element nested in a locked form', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [
        textElement('nestedLocked'),
        textElement('nestedEditable', {
          approverEditability: approverEditable,
        }),
      ],
    } as FormTypes.FormFormElement

    expect(validate([nestedForm], { nestedForm: {} }, 'APPROVER')).toEqual({
      nestedForm: {
        type: 'formElements',
        formElements: {
          nestedEditable: 'Please enter a value',
        },
      },
    })
  })

  test('skips a nested form with nothing an approver can edit', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      label: 'Nested form',
      type: 'form',
      conditionallyShow: false,
      formId: 1,
      elements: [textElement('nestedLocked')],
    } as FormTypes.FormFormElement

    expect(
      validate([nestedForm], { nestedForm: {} }, 'APPROVER'),
    ).toBeUndefined()
  })

  test('skips the entry count of a locked set but validates editable entries', () => {
    const repeatableSet = {
      id: 'repeatable-set',
      name: 'repeatableSet',
      label: 'Repeatable set',
      type: 'repeatableSet',
      conditionallyShow: false,
      minSetEntries: 2,
      elements: [
        textElement('nestedLocked'),
        textElement('nestedEditable', {
          approverEditability: approverEditable,
        }),
      ],
    } as FormTypes.RepeatableSetElement

    expect(
      validate([repeatableSet], { repeatableSet: [{}] }, 'APPROVER'),
    ).toEqual({
      repeatableSet: {
        type: 'repeatableSet',
        set: undefined,
        entries: {
          0: {
            nestedEditable: 'Please enter a value',
          },
        },
      },
    })
  })

  test('validates the entry count of a set for a submitter', () => {
    const repeatableSet = {
      id: 'repeatable-set',
      name: 'repeatableSet',
      label: 'Repeatable set',
      type: 'repeatableSet',
      conditionallyShow: false,
      minSetEntries: 2,
      elements: [textElement('nestedLocked')],
    } as FormTypes.RepeatableSetElement

    const validation = validate(
      [repeatableSet],
      { repeatableSet: [] },
      'SUBMITTER',
    )
    expect(validation?.repeatableSet).toMatchObject({
      type: 'repeatableSet',
      set: 'Must have at least 2 entry/entries',
    })
  })

  test('skips a captcha for an approver', () => {
    const captcha = {
      id: 'captcha',
      name: 'captcha',
      label: 'Captcha',
      type: 'captcha',
      conditionallyShow: false,
      required: true,
    } as FormTypes.CaptchaElement

    expect(validate([captcha], {}, 'APPROVER')).toBeUndefined()
    expect(validate([captcha], {}, 'SUBMITTER')).toEqual({
      captcha: 'Please complete the CAPTCHA successfully',
    })
  })
})
