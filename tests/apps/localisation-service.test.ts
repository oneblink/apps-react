import tenants from '../../src/apps/tenants'
import * as localisationService from '../../src/apps/localisation-service'
import { describe, expect, test } from 'vitest'

describe('parseDate / generateDate', () => {
  test('date-only values are parsed as local midnight', () => {
    const date = localisationService.parseDate('2023-05-04')

    expect(date.getFullYear()).toBe(2023)
    expect(date.getMonth()).toBe(4)
    expect(date.getDate()).toBe(4)
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
    expect(date.getSeconds()).toBe(0)
    expect(date.getMilliseconds()).toBe(0)
  })

  test('full ISO datetime strings preserve time (not date-only local midnight)', () => {
    // Afternoon UTC often lands on the next local calendar day in positive offsets
    // (e.g. AEST). Parsing as yyyy-MM-dd would lose the time and the correct day.
    const iso = '2023-05-04T14:30:00.000Z'
    const parsed = localisationService.parseDate(iso)
    const generated = localisationService.generateDate({
      value: iso,
      daysOffset: undefined,
    })
    const dateOnlyLocalMidnight = localisationService.parseDate('2023-05-04')

    expect(parsed.getTime()).toBe(new Date(iso).getTime())
    expect(generated?.getTime()).toBe(new Date(iso).getTime())
    expect(parsed.getTime()).not.toBe(dateOnlyLocalMidnight.getTime())
    expect(parsed.getUTCHours()).toBe(14)
    expect(parsed.getUTCMinutes()).toBe(30)
  })

  test('generateDate with daysOffset preserves ISO datetime time-of-day', () => {
    const iso = '2023-05-04T14:30:00.000Z'
    const generated = localisationService.generateDate({
      value: iso,
      daysOffset: 1,
    })

    expect(generated?.toISOString()).toBe('2023-05-05T14:30:00.000Z')
  })
})

// Unfortunately this test will not with in Travis CI
// as the locales are not supported, skipping for now.
// Can be un-skipped to run locally when verifying changes.
test.skip('it should format currency, date and times correctly', () => {
  const date1 = new Date('2020-12-21T06:56:37.850Z')
  const date2 = new Date('2020-01-01T13:56:37.850Z')
  const amount1 = 123
  const amount2 = 0.12345
  const amount3 = 9.909
  const amount4 = 9.999

  // OneBlink Tenant
  tenants.useOneBlink()
  expect(localisationService.getLocale()).toBe('en-AU')

  expect(localisationService.formatCurrency(amount1)).toBe('$123.00')
  expect(localisationService.formatCurrency(amount2)).toBe('$0.12')
  expect(localisationService.formatCurrency(amount3)).toBe('$9.91')
  expect(localisationService.formatCurrency(amount4)).toBe('$10.00')

  expect(localisationService.formatDate(date1)).toBe('21/12/2020')
  expect(localisationService.formatDate(date2)).toBe('02/01/2020')

  expect(localisationService.formatDateLong(date1)).toBe(
    'Monday, 21 December 2020',
  )
  expect(localisationService.formatDateLong(date2)).toBe(
    'Thursday, 2 January 2020',
  )

  expect(localisationService.formatTime(date1)).toBe('5:56 pm')
  expect(localisationService.formatTime(date2)).toBe('12:56 am')

  expect(localisationService.formatDatetime(date1)).toBe('21/12/2020 5:56 pm')
  expect(localisationService.formatDatetime(date2)).toBe('02/01/2020 12:56 am')

  expect(localisationService.formatDatetimeLong(date1)).toBe(
    'Monday, 21 December 2020 5:56 pm',
  )
  expect(localisationService.formatDatetimeLong(date2)).toBe(
    'Thursday, 2 January 2020 12:56 am',
  )

  // CivicPlus Tenant
  tenants.useCivicPlus()
  expect(localisationService.getLocale()).toBe('en-US')

  expect(localisationService.formatCurrency(amount1)).toBe('$123.00')
  expect(localisationService.formatCurrency(amount2)).toBe('$0.12')
  expect(localisationService.formatCurrency(amount3)).toBe('$9.91')
  expect(localisationService.formatCurrency(amount4)).toBe('$10.00')

  expect(localisationService.formatDate(date1)).toBe('12/21/2020')
  expect(localisationService.formatDate(date2)).toBe('01/02/2020')

  expect(localisationService.formatDateLong(date1)).toBe(
    'Monday, December 21, 2020',
  )
  expect(localisationService.formatDateLong(date2)).toBe(
    'Thursday, January 2, 2020',
  )

  expect(localisationService.formatTime(date1)).toBe('5:56 PM')
  expect(localisationService.formatTime(date2)).toBe('12:56 AM')

  expect(localisationService.formatDatetime(date1)).toBe('12/21/2020 5:56 PM')
  expect(localisationService.formatDatetime(date2)).toBe('01/02/2020 12:56 AM')

  expect(localisationService.formatDatetimeLong(date1)).toBe(
    'Monday, December 21, 2020 5:56 PM',
  )
  expect(localisationService.formatDatetimeLong(date2)).toBe(
    'Thursday, January 2, 2020 12:56 AM',
  )
})
