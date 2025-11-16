import { expect, it, describe } from 'vitest'
import {
  validators,
  isEmpty,
} from '../../../src/services/form-validation/validate-dot-js'

describe('Utility Functions', () => {
  describe('isEmpty', () => {
    it('should return true for undefined and null', () => {
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty(null)).toBe(true)
    })

    it('should return true for empty strings and strings with only whitespace', () => {
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('   ')).toBe(true)
    })

    it('should return false for non-empty strings', () => {
      expect(isEmpty('Hello')).toBe(false)
    })

    it('should return true for empty arrays and objects', () => {
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
    })

    it('should return false for non-empty arrays and objects', () => {
      expect(isEmpty([1])).toBe(false)
      expect(isEmpty({ key: 'value' })).toBe(false)
    })

    it('should return false for functions', () => {
      expect(isEmpty(() => {})).toBe(false)
    })
  })
})

describe('Validators', () => {
  describe('presence', () => {
    it('should return an error for null or undefined values when allowEmpty is not explicitly set', () => {
      expect(validators.presence(null)).toEqual(["can't be blank"])
      expect(validators.presence(undefined)).toEqual(["can't be blank"])
    })

    it('should return an error for empty strings when allowEmpty is not explicitly set', () => {
      expect(validators.presence('')).toEqual(["can't be blank"])
      expect(validators.presence(' ')).toEqual(["can't be blank"])
    })

    it('should return an error for null if allowEmpty is true', () => {
      expect(validators.presence(null, { allowEmpty: true })).toEqual([
        "can't be blank",
      ])
    })

    it('should return an error for undefined if allowEmpty is true', () => {
      expect(validators.presence(undefined, { allowEmpty: true })).toEqual([
        "can't be blank",
      ])
    })

    it('should not return an error for empty values if allowEmpty is true', () => {
      expect(validators.presence(null, { allowEmpty: true })).toEqual([
        "can't be blank",
      ])
      expect(validators.presence(undefined, { allowEmpty: true })).toEqual([
        "can't be blank",
      ])
      expect(validators.presence('', { allowEmpty: true })).toEqual([])
      expect(validators.presence(' ', { allowEmpty: true })).toEqual([])
    })

    it('should return an error for empty strings if allowEmpty is false', () => {
      expect(validators.presence('', { allowEmpty: false })).toEqual([
        "can't be blank",
      ])
      expect(validators.presence(' ', { allowEmpty: false })).toEqual([
        "can't be blank",
      ])
    })

    it('should not return an error for non-empty values', () => {
      expect(validators.presence('Hello')).toEqual([])
      expect(validators.presence([1, 2, 3])).toEqual([])
      expect(validators.presence({ key: 'value' })).toEqual([])
      expect(validators.presence(123)).toEqual([])
      expect(validators.presence(true)).toEqual([])
    })

    it('should allow customization of the error message', () => {
      const customMessage = 'This field is required'
      expect(validators.presence(null, { message: customMessage })).toEqual([
        customMessage,
      ])
      expect(
        validators.presence('', { allowEmpty: false, message: customMessage }),
      ).toEqual([customMessage])
    })

    it('should handle complex objects and arrays correctly', () => {
      expect(validators.presence({})).toEqual(["can't be blank"])
      expect(validators.presence([])).toEqual(["can't be blank"])
      expect(validators.presence([1, 2, 3], { allowEmpty: false })).toEqual([])
      expect(
        validators.presence({ key: 'value' }, { allowEmpty: false }),
      ).toEqual([])
    })

    it('should treat whitespace-only strings as empty when allowEmpty is false', () => {
      expect(validators.presence('   ', { allowEmpty: false })).toEqual([
        "can't be blank",
      ])
    })

    it('should treat functions as non-empty', () => {
      const func = () => {}
      expect(validators.presence(func)).toEqual([])
    })

    it('should treat empty arrays as blank if allowEmpty is false', () => {
      expect(validators.presence([], { allowEmpty: false })).toEqual([
        "can't be blank",
      ])
    })

    it('should treat non-empty arrays as valid', () => {
      expect(validators.presence([1, 2, 3], { allowEmpty: false })).toEqual([])
    })

    it('should treat empty objects as blank if allowEmpty is false', () => {
      expect(validators.presence({}, { allowEmpty: false })).toEqual([
        "can't be blank",
      ])
    })

    it('should treat non-empty objects as valid', () => {
      expect(
        validators.presence({ key: 'value' }, { allowEmpty: false }),
      ).toEqual([])
    })

    it('should not return errors for falsy values other than null, undefined, or empty strings when allowEmpty is true', () => {
      expect(validators.presence(0, { allowEmpty: true })).toEqual([])
      expect(validators.presence(false, { allowEmpty: true })).toEqual([])
    })

    it('should return errors for falsy values other than null, undefined, or empty strings when allowEmpty is false', () => {
      expect(validators.presence(0, { allowEmpty: false })).toEqual([])
      expect(validators.presence(false, { allowEmpty: false })).toEqual([])
    })
  })

  describe('length', () => {
    it('should allow undefined or null values', () => {
      expect(validators.length(undefined)).toEqual([])
      expect(validators.length(null)).toEqual([])
    })

    it('should return an error for non-string and non-array values', () => {
      expect(validators.length(123)).toEqual(['has an incorrect length'])
      expect(validators.length({})).toEqual(['has an incorrect length'])
      expect(validators.length(true)).toEqual(['has an incorrect length'])
    })

    it('should validate exact length using the "is" option', () => {
      expect(validators.length('hello', { is: 5 })).toEqual([])
      expect(validators.length('hello', { is: 4 })).toEqual([
        'is the wrong length (should be 4 characters)',
      ])
      expect(validators.length([1, 2, 3], { is: 3 })).toEqual([])
      expect(validators.length([1, 2, 3], { is: 2 })).toEqual([
        'is the wrong length (should be 2 characters)',
      ])
    })

    it('should validate minimum length using the "minimum" option', () => {
      expect(validators.length('hello', { minimum: 5 })).toEqual([])
      expect(validators.length('hi', { minimum: 5 })).toEqual([
        'is too short (minimum is 5 characters)',
      ])
      expect(validators.length([1, 2], { minimum: 3 })).toEqual([
        'is too short (minimum is 3 characters)',
      ])
    })

    it('should validate maximum length using the "maximum" option', () => {
      expect(validators.length('hello', { maximum: 5 })).toEqual([])
      expect(validators.length('hello world', { maximum: 5 })).toEqual([
        'is too long (maximum is 5 characters)',
      ])
      expect(validators.length([1, 2, 3, 4], { maximum: 3 })).toEqual([
        'is too long (maximum is 3 characters)',
      ])
    })

    it('should handle combined length constraints', () => {
      const options = { minimum: 5, maximum: 10 }
      expect(validators.length('hello', options)).toEqual([])
      expect(validators.length('hi', options)).toEqual([
        'is too short (minimum is 5 characters)',
      ])
      expect(validators.length('hello world', options)).toEqual([
        'is too long (maximum is 10 characters)',
      ])
    })

    it('should prioritize the "is" constraint over others', () => {
      const options = { is: 5, minimum: 3, maximum: 10 }
      expect(validators.length('hi', options)).toEqual([
        'is the wrong length (should be 5 characters)',
      ])
      expect(validators.length('hello', options)).toEqual([])
      expect(validators.length('hello world', options)).toEqual([
        'is the wrong length (should be 5 characters)',
      ])
    })

    it('should return multiple errors if applicable', () => {
      const options = { minimum: 5, maximum: 10 }
      expect(validators.length('hi', options)).toEqual([
        'is too short (minimum is 5 characters)',
      ])
      expect(validators.length('hello world!', options)).toEqual([
        'is too long (maximum is 10 characters)',
      ])
    })

    it('should use custom error messages if provided', () => {
      const options = {
        minimum: 5,
        maximum: 10,
        tooShort: 'must be at least %{count} characters long',
        tooLong: 'must be at most %{count} characters long',
      }
      expect(validators.length('hi', options)).toEqual([
        'must be at least 5 characters long',
      ])
      expect(validators.length('hello world!', options)).toEqual([
        'must be at most 10 characters long',
      ])
    })

    it('should return a general message if specified', () => {
      const options = {
        minimum: 5,
        maximum: 10,
        message: 'Invalid length',
      }
      expect(validators.length('hi', options)).toEqual(['Invalid length'])
      expect(validators.length('hello world!', options)).toEqual([
        'Invalid length',
      ])
    })

    it('should handle edge cases with zero-length strings or arrays', () => {
      expect(validators.length('', { minimum: 1 })).toEqual([
        'is too short (minimum is 1 characters)',
      ])
      expect(validators.length([], { minimum: 1 })).toEqual([
        'is too short (minimum is 1 characters)',
      ])
      expect(validators.length('', { maximum: 0 })).toEqual([])
    })
  })

  describe('numericality', () => {
    it('should allow undefined or null values', () => {
      expect(validators.numericality(undefined)).toEqual([])
      expect(validators.numericality(null)).toEqual([])
    })

    it('should return an error for non-number values', () => {
      expect(validators.numericality('string')).toEqual(['is not a number'])
      expect(validators.numericality(true)).toEqual(['is not a number'])
      expect(validators.numericality({})).toEqual(['is not a number'])
    })

    it('should validate numbers correctly', () => {
      expect(validators.numericality(10)).toEqual([])
      expect(validators.numericality(-5)).toEqual([])
    })

    it('should validate integer-only constraints', () => {
      expect(validators.numericality(10, { onlyInteger: true })).toEqual([])
      expect(validators.numericality(10.5, { onlyInteger: true })).toEqual([
        'must be an integer',
      ])
    })

    it('should validate greaterThan constraints', () => {
      expect(validators.numericality(10, { greaterThan: 5 })).toEqual([])
      expect(validators.numericality(5, { greaterThan: 10 })).toEqual([
        'must be greater than 10',
      ])
    })

    it('should validate greaterThanOrEqualTo constraints', () => {
      expect(validators.numericality(10, { greaterThanOrEqualTo: 10 })).toEqual(
        [],
      )
      expect(validators.numericality(9, { greaterThanOrEqualTo: 10 })).toEqual([
        'must be greater than or equal to 10',
      ])
    })

    it('should validate lessThan constraints', () => {
      expect(validators.numericality(5, { lessThan: 10 })).toEqual([])
      expect(validators.numericality(10, { lessThan: 5 })).toEqual([
        'must be less than 5',
      ])
    })

    it('should validate lessThanOrEqualTo constraints', () => {
      expect(validators.numericality(5, { lessThanOrEqualTo: 5 })).toEqual([])
      expect(validators.numericality(10, { lessThanOrEqualTo: 5 })).toEqual([
        'must be less than or equal to 5',
      ])
    })

    it('should validate equalTo constraints', () => {
      expect(validators.numericality(5, { equalTo: 5 })).toEqual([])
      expect(validators.numericality(10, { equalTo: 5 })).toEqual([
        'must be equal to 5',
      ])
    })

    it('should validate divisibility constraints', () => {
      expect(validators.numericality(10, { divisibleBy: 2 })).toEqual([])
      expect(validators.numericality(10, { divisibleBy: 3 })).toEqual([
        'must be divisible by 3',
      ])
    })

    it('should validate odd constraints', () => {
      expect(validators.numericality(3, { odd: true })).toEqual([])
      expect(validators.numericality(4, { odd: true })).toEqual(['must be odd'])
    })

    it('should validate even constraints', () => {
      expect(validators.numericality(4, { even: true })).toEqual([])
      expect(validators.numericality(3, { even: true })).toEqual([
        'must be even',
      ])
    })

    it('should handle multiple constraints and return all errors', () => {
      const options = {
        greaterThan: 10,
        lessThan: 5,
        divisibleBy: 3,
      }
      expect(validators.numericality(7, options)).toEqual([
        'must be greater than 10',
        'must be less than 5',
        'must be divisible by 3',
      ])
    })

    it('should prioritize custom error messages over defaults', () => {
      const options = {
        greaterThan: 10,
        notGreaterThan: 'Must be higher than %{count}',
        lessThan: 5,
        notLessThan: 'Must be lower than %{count}',
        divisibleBy: 3,
        notDivisibleBy: 'Must be divisible by %{count}',
      }
      expect(validators.numericality(7, options)).toEqual([
        'Must be higher than 10',
        'Must be lower than 5',
        'Must be divisible by 3',
      ])
    })

    it('should return a single error if a general message is provided', () => {
      const options = {
        greaterThan: 10,
        lessThan: 5,
        divisibleBy: 3,
        message: 'Invalid number',
      }
      expect(validators.numericality(7, options)).toEqual(['Invalid number'])
    })

    it('should handle edge cases with zero', () => {
      expect(validators.numericality(0, { greaterThan: -1 })).toEqual([])
      expect(validators.numericality(0, { lessThan: 0 })).toEqual([
        'must be less than 0',
      ])
      expect(validators.numericality(0, { divisibleBy: 5 })).toEqual([])
    })
  })

  describe('email', () => {
    it('should return an error for undefined or null values', () => {
      expect(validators.email(undefined)).toEqual([])
      expect(validators.email(null)).toEqual([])
    })

    it('should return an error for non-string values', () => {
      expect(validators.email(123)).toEqual(['is not a valid email'])
      expect(validators.email(true)).toEqual(['is not a valid email'])
      expect(validators.email({})).toEqual(['is not a valid email'])
      expect(validators.email([])).toEqual(['is not a valid email'])
      expect(validators.email(() => {})).toEqual(['is not a valid email'])
    })

    it('should return an error for invalid email strings', () => {
      expect(validators.email('plainaddress')).toEqual(['is not a valid email'])
      expect(validators.email('@@example.com')).toEqual([
        'is not a valid email',
      ])
      expect(validators.email('user@.com')).toEqual(['is not a valid email'])
      expect(validators.email('user@com')).toEqual(['is not a valid email'])
      expect(validators.email('user@domain,com')).toEqual([
        'is not a valid email',
      ])
    })

    it('should not return an error for valid email strings', () => {
      expect(validators.email('user@example.com')).toEqual([])
      expect(validators.email('USER@EXAMPLE.COM')).toEqual([])
      expect(validators.email('user.name+tag+sorting@example.com')).toEqual([])
      expect(validators.email('x@x.au')).toEqual([])
      expect(validators.email('example-indeed@strange-example.com')).toEqual([])
    })

    it('should allow custom error messages', () => {
      const customMessage = 'Invalid email address provided'
      expect(
        validators.email('plainaddress', { message: customMessage }),
      ).toEqual([customMessage])
      expect(validators.email(null, { message: customMessage })).toEqual([])
      expect(validators.email('user@.com', { message: customMessage })).toEqual(
        [customMessage],
      )
    })

    it('should handle emails with unusual but valid formats', () => {
      expect(
        validators.email('user+mailbox/department=shipping@example.com'),
      ).toEqual([])
      expect(
        validators.email('customer/department=shipping@example.com'),
      ).toEqual([])
      expect(validators.email('$A12345@example.com')).toEqual([])
      expect(validators.email('!def!xyz%abc@example.com')).toEqual([])
      expect(validators.email('_somename@example.com')).toEqual([])
    })

    it('should reject emails with valid local parts but invalid domains', () => {
      expect(validators.email('user@domain')).toEqual(['is not a valid email'])
      expect(validators.email('user@domain..com')).toEqual([
        'is not a valid email',
      ])
    })

    it('should return an error for whitespace-only strings', () => {
      expect(validators.email(' ')).toEqual(['is not a valid email'])
      expect(validators.email('\t\n')).toEqual(['is not a valid email'])
    })

    it('should trim strings and validate trimmed emails', () => {
      expect(validators.email('  user@example.com  ')).toEqual([
        'is not a valid email',
      ])
    })

    it('should handle edge cases of empty strings', () => {
      expect(validators.email('')).toEqual(['is not a valid email'])
    })
  })

  describe('regexValidation', () => {
    it('should allow undefined or null values', () => {
      expect(validators.regexValidation(undefined, /.+/)).toEqual([])
      expect(validators.regexValidation(null, /.+/)).toEqual([])
    })

    it('should return an error for non-string values', () => {
      expect(validators.regexValidation(123, /.+/)).toEqual(['is invalid'])
      expect(validators.regexValidation(true, /.+/)).toEqual(['is invalid'])
      expect(validators.regexValidation({}, /.+/)).toEqual(['is invalid'])
      expect(validators.regexValidation([], /.+/)).toEqual(['is invalid'])
      expect(validators.regexValidation(() => {}, /.+/)).toEqual(['is invalid'])
    })

    it('should validate strings against a regular expression', () => {
      expect(validators.regexValidation('abc', /^[a-z]+$/)).toEqual([])
      expect(validators.regexValidation('123', /^[a-z]+$/)).toEqual([
        'is invalid',
      ])
    })

    it('should handle string patterns', () => {
      expect(
        validators.regexValidation('abc', { pattern: '^[a-z]+$', flags: 'g' }),
      ).toEqual([])
      expect(
        validators.regexValidation('123', { pattern: '^[a-z]+$', flags: 'g' }),
      ).toEqual(['is invalid'])
    })

    it('should use the full pattern match by default', () => {
      expect(validators.regexValidation('abc123', /^[a-z]+$/)).toEqual([
        'is invalid',
      ])
      expect(validators.regexValidation('abc', /^[a-z]+$/)).toEqual([])
    })

    it('should allow custom error messages', () => {
      const customMessage = 'does not match the required format'
      expect(
        validators.regexValidation('123', {
          pattern: /^[a-z]+$/,
          message: customMessage,
        }),
      ).toEqual([customMessage])
      expect(
        validators.regexValidation('abc', {
          pattern: /^[a-z]+$/,
          message: customMessage,
        }),
      ).toEqual([])
    })

    it('should match strings with optional flags', () => {
      expect(validators.regexValidation('ABC', /^[a-z]+$/i)).toEqual([])
      expect(
        validators.regexValidation('ABC', { pattern: '^[a-z]+$', flags: 'i' }),
      ).toEqual([])
    })

    it('should return an error for strings that partially match the pattern', () => {
      expect(validators.regexValidation('abc123', /^[a-z]+/)).toEqual([
        'is invalid',
      ])
    })

    it('should return an error for empty strings if the pattern requires characters', () => {
      expect(validators.regexValidation('', /^[a-z]+$/)).toEqual(['is invalid'])
    })

    it('should handle patterns without capturing groups', () => {
      expect(validators.regexValidation('test123', /\d+/)).toEqual([
        'is invalid',
      ])
      expect(validators.regexValidation('123', /\d+/)).toEqual([])
    })

    it('should validate strings with multiple patterns', () => {
      const patterns = [/^[a-z]+$/, /^[A-Z]+$/]
      const errors = patterns.map((pattern) =>
        validators.regexValidation('123', pattern),
      )
      expect(errors).toEqual([['is invalid'], ['is invalid']])
    })

    it('should handle patterns with special characters', () => {
      expect(validators.regexValidation('a.c', /^[a.c]+$/)).toEqual([])
      expect(validators.regexValidation('a+c', /^[a.c]+$/)).toEqual([
        'is invalid',
      ])
    })

    it('should validate using an exact match for both string and RegExp patterns', () => {
      expect(validators.regexValidation('hello', /hello/)).toEqual([])
      expect(validators.regexValidation('hello', 'hello')).toEqual([])
    })

    it('should validate edge cases like single character patterns', () => {
      expect(validators.regexValidation('a', /^[a]$/)).toEqual([])
      expect(validators.regexValidation('b', /^[a]$/)).toEqual(['is invalid'])
    })
  })
})
