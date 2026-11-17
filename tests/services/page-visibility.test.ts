import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'

import {
  getNavigablePages,
  getRenderedPages,
} from '../../src/services/page-visibility'
import { FormElementsConditionallyShown } from '../../src/types/form'

function page(
  id: string,
  options: Partial<FormTypes.PageElement> = {},
): FormTypes.PageElement {
  return {
    id,
    type: 'page',
    label: id,
    conditionallyShow: false,
    elements: [],
    ...options,
  }
}

describe('page visibility', () => {
  const pages = [
    page('details'),
    page('approver', { isHidden: true, hiddenFrom: ['SUBMITTER'] }),
    page('submitter', { isHidden: true, hiddenFrom: ['APPROVER'] }),
    page('internal', { isHidden: true }),
  ]

  test('keeps audience-hidden pages rendered so their elements still run', () => {
    expect(getRenderedPages(pages, undefined).map((page) => page.id)).toEqual([
      'details',
      'approver',
      'submitter',
      'internal',
    ])
  })

  test('leaves a page out of navigation for the audiences it is hidden from', () => {
    expect(
      getNavigablePages(pages, undefined, 'SUBMITTER').map((page) => page.id),
    ).toEqual(['details', 'submitter'])
    expect(
      getNavigablePages(pages, undefined, 'APPROVER').map((page) => page.id),
    ).toEqual(['details', 'approver'])
  })

  test('leaves a conditionally hidden page out of rendering and navigation', () => {
    const formElementsConditionallyShown: FormElementsConditionallyShown = {
      approver: { type: 'formElement', isHidden: true },
    }

    expect(
      getRenderedPages(pages, formElementsConditionallyShown).map(
        (page) => page.id,
      ),
    ).toEqual(['details', 'submitter', 'internal'])
    expect(
      getNavigablePages(
        pages,
        formElementsConditionallyShown,
        'APPROVER',
      ).map((page) => page.id),
    ).toEqual(['details'])
  })
})
