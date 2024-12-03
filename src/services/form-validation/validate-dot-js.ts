import * as EmailValidator from 'email-validator'

const EMPTY_STRING_REGEXP = /^\s*$/
const FORMAT_REGEXP = /(%?)%\{([^}]+)\}/g

/**
 * Checks if the value is a number. This function does not consider NaN a number
 * like many other `isNumber` functions do.
 *
 * @param value
 * @returns
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Returns false if the object is not a function
 *
 * @param value
 * @returns
 */
function isFunction(value: unknown) {
  return typeof value === 'function'
}

/**
 * A simple check to verify that the value is an integer. Uses `isNumber` and a
 * simple modulo check.
 *
 * @param value
 * @returns
 */
function isInteger(value: unknown): value is number {
  return isNumber(value) && value % 1 === 0
}

/**
 * Uses the `Object` function to check if the given argument is an object.
 *
 * @param obj
 * @returns
 */
function isObject(obj: unknown): obj is object {
  return obj === Object(obj)
}

/**
 * Simply checks if the object is an instance of a date
 *
 * @param obj
 * @returns
 */
function isDate(obj: unknown): obj is Date {
  return obj instanceof Date
}

/**
 * Returns false if the object is `null` of `undefined`
 *
 * @param obj
 * @returns
 */
function isDefined(obj: unknown) {
  return obj !== null && obj !== undefined
}

export function isEmpty(value: unknown) {
  // Null and undefined are empty
  if (!isDefined(value)) {
    return true
  }

  // functions are non empty
  if (isFunction(value)) {
    return false
  }

  // Whitespace only strings are empty
  if (isString(value)) {
    return EMPTY_STRING_REGEXP.test(value)
  }

  // For arrays we use the length property
  if (isArray(value)) {
    return value.length === 0
  }

  // Dates have no attributes but aren't empty
  if (isDate(value)) {
    return false
  }

  // If we find at least one property we consider it non empty
  if (isObject(value)) {
    for (const _attr in value) {
      return false
    }
    return true
  }

  return false
}

/**
 * Formats the specified strings with the given values like so:
 *
 *     format('Foo: %{foo}', { foo: 'bar' }) // "Foo bar"
 *
 * If you want to write %{...} without having it replaced simply prefix it with
 * % like this `Foo: %%{foo}` and it will be returned as `"Foo: %{foo}"`
 *
 * @param str
 * @param vals
 * @returns
 */
function formatValidationMessage(
  str: string,
  vals: Record<string, unknown>,
): string {
  if (!isString(str)) {
    return str
  }
  return str.replace(FORMAT_REGEXP, function (m0, m1, m2) {
    if (m1 === '%') {
      return '%{' + m2 + '}'
    } else {
      return String(vals[m2])
    }
  })
}

function isString(value: unknown) {
  return typeof value === 'string'
}

function isArray(value: unknown) {
  return Array.isArray(value)
}

export const validators = {
  /**
   * Presence validates that the value isn't empty
   *
   * @param value
   * @param options
   * @returns
   */
  presence(
    value: unknown,
    options?: { allowEmpty?: boolean; message?: string },
  ): string[] {
    if (options?.allowEmpty ? !isDefined(value) : isEmpty(value)) {
      return [options?.message || "can't be blank"]
    }

    return []
  },

  length(
    value: unknown,
    options?: {
      message?: string
      is?: number
      minimum?: number
      maximum?: number
      tooShort?: string
      tooLong?: string
      wrongLength?: string
    },
  ): string[] {
    // Empty values are allowed
    if (!isDefined(value)) {
      return []
    }

    const length = (value as { length?: unknown } | string | Array<unknown>)
      ?.length
    const { message, is, minimum, maximum, tooShort, tooLong, wrongLength } =
      options || {}

    if (!isNumber(length)) {
      return [message || 'has an incorrect length']
    }

    // Is checks
    if (isNumber(is) && length !== is) {
      const err =
        wrongLength || 'is the wrong length (should be %{count} characters)'
      return [formatValidationMessage(err, { count: is })]
    }

    const errors: string[] = []
    if (isNumber(minimum) && length < minimum) {
      const err = tooShort || 'is too short (minimum is %{count} characters)'
      errors.push(formatValidationMessage(err, { count: minimum }))
    }

    if (isNumber(maximum) && length > maximum) {
      const err = tooLong || 'is too long (maximum is %{count} characters)'
      errors.push(formatValidationMessage(err, { count: maximum }))
    }

    if (errors.length > 0) {
      return message ? [message] : errors
    }

    return []
  },
  numericality(
    value: unknown,
    options?: {
      message?: string
      notValid?: string
      onlyInteger?: boolean
      notInteger?: string
      greaterThan?: number
      notGreaterThan?: string
      greaterThanOrEqualTo?: number
      notGreaterThanOrEqualTo?: string
      lessThanOrEqualTo?: number
      notLessThanOrEqualTo?: string
      equalTo?: number
      notEqualTo?: string
      lessThan?: number
      notLessThan?: string
      divisibleBy?: number
      notDivisibleBy?: string
      odd?: boolean
      notOdd?: string
      even?: boolean
      notEven?: string
    },
  ): string[] {
    // Empty values are fine
    if (!isDefined(value)) {
      return []
    }

    // If it's not a number we shouldn't continue since it will compare it.
    if (!isNumber(value)) {
      return [options?.message || options?.notValid || 'is not a number']
    }

    // Same logic as above, sort of. Don't bother with comparisons if this
    // doesn't pass.
    if (options?.onlyInteger && !isInteger(value)) {
      return [options?.message || options?.notInteger || 'must be an integer']
    }

    const checks = [
      {
        name: 'greater than',
        message: options?.notGreaterThan,
        predicateValue: options?.greaterThan,
        predicate(predicateValue: number) {
          return value > predicateValue
        },
      },
      {
        name: 'greater than or equal to',
        message: options?.notGreaterThanOrEqualTo,
        predicateValue: options?.greaterThanOrEqualTo,
        predicate(predicateValue: number) {
          return value >= predicateValue
        },
      },
      {
        name: 'equal to',
        message: options?.notEqualTo,
        predicateValue: options?.equalTo,
        predicate(predicateValue: number) {
          return value === predicateValue
        },
      },
      {
        name: 'less than',
        message: options?.notLessThan,
        predicateValue: options?.lessThan,
        predicate(predicateValue: number) {
          return value < predicateValue
        },
      },
      {
        name: 'less than or equal to',
        message: options?.notLessThanOrEqualTo,
        predicateValue: options?.lessThanOrEqualTo,
        predicate(predicateValue: number) {
          return value <= predicateValue
        },
      },
      {
        name: 'divisible by',
        message: options?.notDivisibleBy,
        predicateValue: options?.divisibleBy,
        predicate(predicateValue: number) {
          return value % predicateValue === 0
        },
      },
    ]

    const errors: string[] = []

    for (const check of checks) {
      if (
        isNumber(check.predicateValue) &&
        !check.predicate(check.predicateValue)
      ) {
        // This picks the default message if specified
        // For example the greaterThan check uses the message from
        // this.notGreaterThan so we capitalize the name and prepend "not"
        const msg = check.message || 'must be %{type} %{count}'

        errors.push(
          formatValidationMessage(msg, {
            count: check.predicateValue,
            type: check.name,
          }),
        )
      }
    }

    if (options?.odd && value % 2 !== 1) {
      errors.push(options.notOdd || 'must be odd')
    }
    if (options?.even && value % 2 !== 0) {
      errors.push(options.notEven || 'must be even')
    }

    if (errors.length) {
      return options?.message ? [options.message] : errors
    }

    return []
  },

  datetime(
    value: unknown,
    {
      format,
      ...options
    }: {
      format: (date: Date) => string
      earliest?: string
      latest?: string
      tooEarly?: string
      tooLate?: string
      dateOnly?: boolean
      notValid?: string
      message?: string
    },
  ): string[] {
    // Empty values are fine
    if (!isDefined(value)) {
      return []
    }

    let num = value
    if (isString(value)) {
      num = Date.parse(value)
    }

    // 86400000 is the number of milliseconds in a day, this is used to remove
    // the time from the date
    if (
      !isNumber(num) ||
      isNaN(num) ||
      (options.dateOnly && num % 86400000 !== 0)
    ) {
      const err = options.notValid || options.message || 'must be a valid date'
      return [formatValidationMessage(err, { value })]
    }

    const errors = []

    const earliest = options.earliest ? Date.parse(options.earliest) : NaN
    if (!isNaN(earliest) && num < earliest) {
      const err =
        options.tooEarly || options.message || 'must be no earlier than %{date}'
      errors.push(
        formatValidationMessage(err, {
          value: format(new Date(num)),
          date: format(new Date(earliest)),
        }),
      )
    }

    const latest = options.latest ? Date.parse(options.latest) : NaN
    if (!isNaN(latest) && num > latest) {
      const err =
        options.tooLate || options.message || 'must be no later than %{date}'
      errors.push(
        formatValidationMessage(err, {
          date: format(new Date(latest)),
          value: format(new Date(num)),
        }),
      )
    }

    return errors
  },

  regexValidation(
    value: unknown,
    options:
      | {
          pattern: RegExp | string
          message?: string
          flags?: string
        }
      | RegExp
      | string,
  ): string[] {
    if (isString(options) || options instanceof RegExp) {
      options = { pattern: options }
    }

    const message = options.message || 'is invalid'

    // Empty values are allowed
    if (!isDefined(value)) {
      return []
    }
    if (!isString(value)) {
      return [message]
    }

    let pattern = options.pattern
    if (isString(pattern)) {
      pattern = new RegExp(options.pattern, options.flags)
    }
    const match = pattern.exec(value)
    if (!match || match[0].length != value.length) {
      return [message]
    }

    return []
  },

  email(value: unknown, options?: { message?: string }): string[] {
    // Empty values are fine
    if (!isDefined(value)) {
      return []
    }

    const message = options?.message || 'is not a valid email'
    if (!isString(value)) {
      return [message]
    }
    if (!EmailValidator.validate(value)) {
      return [message]
    }

    return []
  },
}
