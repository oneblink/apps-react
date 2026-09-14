import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import {
  checkAreLookupsDisallowed,
  checkIsFormElementEditable,
  checkIsFormElementReadOnly,
  expandEditableFormElementIds,
  getNestedEditableFormElementIds,
} from '../src/utils/read-only-form-elements'
import {
  generateConfirmationFormElementName,
  injectDynamicElements,
} from '../src/services/dynamic-elements'

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
      checkIsFormElementReadOnly(textElement('editable', { readOnly: true }), {
        isFormReadOnly: true,
        editableFormElementIds: ['editable'],
      }),
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
      checkIsFormElementEditable(textElement('locked', { readOnly: true })),
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

    expect(checkIsFormElementEditable(nestedForm, ['nested-editable'])).toBe(
      true,
    )
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

    expect(checkIsFormElementEditable(nestedForm, ['another-element'])).toBe(
      false,
    )
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

    expect(checkIsFormElementEditable(infoPage, ['nested-editable'])).toBe(true)
  })
})

describe('getNestedEditableFormElementIds()', () => {
  test('includes every descendant when a nested form is listed', () => {
    const contactEmail = {
      id: 'emergency-contact-email',
      name: 'contactEmail',
      label: 'Contact email',
      type: 'email',
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
      requiresConfirmation: true,
    } as FormTypes.EmailElement
    const [nestedForm] = injectDynamicElements([
      {
        id: 'nested-form',
        name: 'nestedForm',
        type: 'form',
        formId: 2,
        conditionallyShow: false,
        elements: [contactEmail],
      },
    ] as FormTypes.FormElement[])

    expect(
      getNestedEditableFormElementIds(nestedForm as FormTypes.FormFormElement, [
        'nested-form',
      ]),
    ).toEqual([
      'emergency-contact-email',
      generateConfirmationFormElementName(contactEmail),
    ])
  })

  test('includes deeply nested element ids', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      type: 'form',
      formId: 2,
      conditionallyShow: false,
      elements: [
        textElement('nested-text'),
        {
          id: 'nested-set',
          name: 'nestedSet',
          label: 'Nested set',
          type: 'repeatableSet',
          conditionallyShow: false,
          elements: [textElement('set-text')],
        },
      ],
    } as FormTypes.FormFormElement

    expect(
      getNestedEditableFormElementIds(nestedForm, ['nested-form']),
    ).toEqual(['nested-text', 'nested-set', 'set-text'])
  })

  test('returns an empty whitelist for an unlisted nested form', () => {
    const nestedForm = {
      id: 'nested-form',
      name: 'nestedForm',
      type: 'form',
      formId: 2,
      conditionallyShow: false,
      elements: [textElement('colliding-id')],
    } as FormTypes.FormFormElement

    expect(
      getNestedEditableFormElementIds(nestedForm, ['colliding-id']),
    ).toEqual([])
  })
})

describe('expandEditableFormElementIds()', () => {
  test('includes elements injected by a listed lookup', () => {
    const formElements = [
      textElement('lookup-source'),
      {
        ...textElement('lookup-returned'),
        injectedByElementId: 'lookup-source',
      },
    ] as FormTypes.FormElement[]

    expect(
      expandEditableFormElementIds(['lookup-source'], formElements),
    ).toEqual(['lookup-source', 'lookup-returned'])
  })

  test('includes descendants of a page injected by a listed lookup', () => {
    const formElements = [
      textElement('lookup-source'),
      {
        id: 'injected-page',
        type: 'page',
        label: 'Injected page',
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        injectedByElementId: 'lookup-source',
        elements: [textElement('injected-text')],
      },
    ] as FormTypes.FormElement[]

    expect(
      expandEditableFormElementIds(['lookup-source'], formElements),
    ).toEqual(['lookup-source', 'injected-page', 'injected-text'])
  })

  test('does not include elements injected by an unlisted lookup', () => {
    const formElements = [
      textElement('lookup-source'),
      {
        ...textElement('lookup-returned'),
        injectedByElementId: 'lookup-source',
      },
    ] as FormTypes.FormElement[]

    expect(
      expandEditableFormElementIds(['another-element'], formElements),
    ).toEqual(['another-element'])
  })

  test('includes the confirmation sibling of an injected email', () => {
    const injectedEmail = {
      id: 'lookup-returned',
      name: 'returnedEmail',
      label: 'Returned email',
      type: 'email',
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
      requiresConfirmation: true,
      injectedByElementId: 'lookup-source',
    } as FormTypes.EmailElement
    const formElements = injectDynamicElements([
      textElement('lookup-source'),
      injectedEmail,
    ] as FormTypes.FormElement[])
    const confirmationElement = formElements.find(
      (element) =>
        element.id === generateConfirmationFormElementName(injectedEmail),
    )
    if (confirmationElement && 'injectedByElementId' in confirmationElement) {
      delete confirmationElement.injectedByElementId
    }

    expect(
      expandEditableFormElementIds(['lookup-source'], formElements),
    ).toEqual([
      'lookup-source',
      'lookup-returned',
      generateConfirmationFormElementName(injectedEmail),
    ])
  })

  test('includes the confirmation field of a listed email', () => {
    const listedEmail = {
      id: 'listed-email',
      name: 'listedEmail',
      label: 'Listed email',
      type: 'email',
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
      requiresConfirmation: true,
    } as FormTypes.EmailElement

    expect(
      expandEditableFormElementIds(
        ['listed-email'],
        injectDynamicElements([listedEmail]),
      ),
    ).toEqual(['listed-email', generateConfirmationFormElementName(listedEmail)])
  })
})
