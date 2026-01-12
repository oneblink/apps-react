import { formatQueryString } from '../../../src/apps/services/query-string'
import { expect, describe, it } from 'vitest'

describe('query-string', () => {
  it('should handle strings', () => {
    expect(formatQueryString({ query: 'hello' })).toEqual('query=hello')
  })

  it('should handle numbers', () => {
    expect(formatQueryString({ count: 2 })).toEqual('count=2')
  })

  it('should handle booleans', () => {
    expect(formatQueryString({ strung: true })).toEqual('strung=true')
  })

  it('should handle arrays', () => {
    expect(formatQueryString({ status: ['good', 'bad'] })).toEqual(
      'status=good&status=bad',
    )
  })

  it('should ignore undefined and null', () => {
    expect(formatQueryString({ nullable: null, missing: undefined })).toEqual(
      '',
    )
  })
})
