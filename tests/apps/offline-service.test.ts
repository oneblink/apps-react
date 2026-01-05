import { isOffline } from '../../src/apps/offline-service'
import { expect, test } from 'vitest'
test('isOffline should return false', () => {
  return expect(isOffline()).toBe(false)
})
