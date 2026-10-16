import { describe, expect, test } from 'vitest'
import { FormTypes } from '@oneblink/types'
import getRepeatableSetEntriesConfiguration from '../../src/services/getRepeatableSetEntriesConfiguration'

const radioElementId = '95fa4c98-deb5-403b-a3ac-594dfcf645de'
const numberElementId = '6b3047d5-5d46-43ad-83b6-16f25891cd7a'

const elements: FormTypes.FormElement[] = [
  {
    id: radioElementId,
    name: 'min_entries_radio',
    type: 'radio',
    label: 'Min entries',
    readOnly: false,
    required: false,
    conditionallyShow: false,
    requiresAllConditionallyShowPredicates: false,
    isElementLookup: false,
    isDataLookup: false,
    optionsType: 'CUSTOM',
    buttons: false,
    options: [
      { id: 'option1', label: 'One', value: '1' },
      { id: 'option2', label: 'Two', value: '2' },
    ],
  },
  {
    id: numberElementId,
    name: 'min_entries_number',
    type: 'number',
    label: 'Min entries',
    readOnly: false,
    required: false,
    conditionallyShow: false,
    requiresAllConditionallyShowPredicates: false,
    isElementLookup: false,
    isDataLookup: false,
    isSlider: false,
    isInteger: false,
  },
]

describe('getRepeatableSetEntriesConfiguration()', () => {
  test('resolves numeric min from a number element', () => {
    const result = getRepeatableSetEntriesConfiguration(
      { type: 'FORM_ELEMENT', elementId: numberElementId },
      elements,
      { min_entries_number: 2 },
    )

    expect(result).toBe(2)
  })

  test('resolves numeric min from a radio element (string option value)', () => {
    const result = getRepeatableSetEntriesConfiguration(
      { type: 'FORM_ELEMENT', elementId: radioElementId },
      elements,
      { min_entries_radio: '2' },
    )

    expect(result).toBe(2)
  })

  test('returns undefined when mapped element has no numeric value', () => {
    const result = getRepeatableSetEntriesConfiguration(
      { type: 'FORM_ELEMENT', elementId: radioElementId },
      elements,
      {},
    )

    expect(result).toBeUndefined()
  })

  test('returns static min when configured as a number', () => {
    const result = getRepeatableSetEntriesConfiguration(3, elements, {})

    expect(result).toBe(3)
  })
})
