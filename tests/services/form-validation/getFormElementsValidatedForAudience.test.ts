import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'

import getFormElementsValidatedForAudience from '../../../src/services/form-validation/getFormElementsValidatedForAudience'

function textElement(id: string): FormTypes.TextElement {
  return {
    id,
    name: id,
    label: id,
    type: 'text',
    required: true,
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
  }
}

function page(
  id: string,
  elements: FormTypes.FormElement[],
  options: Partial<FormTypes.PageElement> = {},
): FormTypes.PageElement {
  return {
    id,
    type: 'page',
    label: id,
    conditionallyShow: false,
    elements,
    ...options,
  }
}

describe('getFormElementsValidatedForAudience', () => {
  const pages = [
    page('details', [textElement('name')]),
    page('approver', [textElement('decision')], {
      isHidden: true,
      hiddenFrom: ['SUBMITTER'],
    }),
    page(
      'nested',
      [
        {
          id: 'section',
          type: 'section',
          label: 'Section',
          conditionallyShow: false,
          isCollapsed: false,
          elements: [textElement('section-field')],
        },
      ],
      { isHidden: true, hiddenFrom: ['APPROVER'] },
    ),
  ]

  test('skips elements on pages hidden from the submitter', () => {
    expect(
      getFormElementsValidatedForAudience(pages, 'SUBMITTER').map(
        (element) => element.name,
      ),
    ).toEqual(['name', 'section-field'])
  })

  test('skips elements on pages hidden from the approver, including nested elements', () => {
    expect(
      getFormElementsValidatedForAudience(pages, 'APPROVER').map(
        (element) => element.name,
      ),
    ).toEqual(['name', 'decision'])
  })

  test('skips a page hidden from both audiences', () => {
    const hiddenFromBoth = page('both', [textElement('secret')], {
      isHidden: true,
    })

    expect(
      getFormElementsValidatedForAudience(
        [hiddenFromBoth],
        'SUBMITTER',
      ).map((element) => element.name),
    ).toEqual([])
    expect(
      getFormElementsValidatedForAudience([hiddenFromBoth], 'APPROVER').map(
        (element) => element.name,
      ),
    ).toEqual([])
  })
})
