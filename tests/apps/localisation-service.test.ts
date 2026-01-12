import tenants from '../../src/apps/tenants'
import * as localisationService from '../../src/apps/localisation-service'
import { expect, test } from 'vitest'

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
