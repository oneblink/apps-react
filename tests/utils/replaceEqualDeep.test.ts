import { expect, it, describe } from 'vitest'
import replaceEqualDeep from '../../src/utils/replaceEqualDeep'

describe('replaceEqualDeep', () => {
  it('should return the previous value when deeply equal', () => {
    const previous = { a: { type: 'formElement', isHidden: false }, b: [1, 2] }
    const next = { a: { type: 'formElement', isHidden: false }, b: [1, 2] }
    expect(replaceEqualDeep(previous, next)).toBe(previous)
  })

  it('should reuse unchanged branches when a nested value changes', () => {
    const previous = {
      set: {
        entries: {
          '0': { text: { isHidden: false } },
          '1': { text: { isHidden: false } },
        },
      },
      other: { isHidden: true },
    }
    const next = {
      set: {
        entries: {
          '0': { text: { isHidden: false } },
          '1': { text: { isHidden: true } },
        },
      },
      other: { isHidden: true },
    }
    const result = replaceEqualDeep(previous, next)
    expect(result).toEqual(next)
    expect(result).not.toBe(previous)
    expect(result.set.entries['0']).toBe(previous.set.entries['0'])
    expect(result.set.entries['1']).not.toBe(previous.set.entries['1'])
    expect(result.other).toBe(previous.other)
  })

  it('should not reuse the previous value when keys are added or removed', () => {
    const previous: Record<string, unknown> = { a: 1, b: undefined }
    expect(replaceEqualDeep(previous, { a: 1 })).toEqual({ a: 1 })
    expect(replaceEqualDeep(previous, { a: 1 })).not.toBe(previous)
    expect(replaceEqualDeep({ a: 1 }, { a: 1, b: undefined })).toEqual({
      a: 1,
      b: undefined,
    })
  })

  it('should not reuse the previous array when items are added or removed', () => {
    const previous = [{ a: 1 }, { b: 2 }]
    const result = replaceEqualDeep(previous, [{ a: 1 }])
    expect(result).toEqual([{ a: 1 }])
    expect(result).not.toBe(previous)
    expect(result[0]).toBe(previous[0])
  })

  it('should return next for values that are not arrays or plain objects', () => {
    const date = new Date()
    expect(replaceEqualDeep(new Date(date), date)).toBe(date)
    expect(replaceEqualDeep({ a: 1 }, 'string')).toBe('string')
    expect(replaceEqualDeep(undefined, { a: 1 })).toEqual({ a: 1 })
  })
})
