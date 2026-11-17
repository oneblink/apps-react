import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  deleteAutoSaveData,
  upsertAutoSaveData,
} from '../../src/apps/auto-save-service'

const { removeLocalForageItem, setLocalForageItem } = vi.hoisted(() => ({
  removeLocalForageItem: vi.fn(),
  setLocalForageItem: vi.fn(),
}))

vi.mock('../../src/apps/services/utils', () => ({
  default: { removeLocalForageItem, setLocalForageItem },
}))

beforeEach(() => {
  removeLocalForageItem.mockReset().mockResolvedValue(undefined)
  setLocalForageItem.mockReset().mockImplementation(async (_, data) => data)
})

describe('deleteAutoSaveData()', () => {
  test('deletes the data saved alongside the submission', async () => {
    await deleteAutoSaveData(1, 'my-key')

    expect(removeLocalForageItem.mock.calls).toStrictEqual([
      ['AUTO_SAVE_1_my-key'],
      ['AUTO_SAVE_1_LAST_ELEMENT_UPDATED_my-key'],
      ['AUTO_SAVE_1_SECTION_STATE_my-key'],
      ['AUTO_SAVE_1_PREVIOUS_ELAPSED_DURATION_my-key'],
    ])
  })

  test('waits for an in progress save to finish', async () => {
    let resolveSet: () => void = () => {}
    setLocalForageItem.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveSet = resolve)),
    )

    const upserting = upsertAutoSaveData(1, 'my-key', { name: 'Blinky Bill' })
    const deleting = deleteAutoSaveData(1, 'my-key')
    await vi.waitFor(() => expect(setLocalForageItem).toHaveBeenCalled())
    expect(removeLocalForageItem).not.toHaveBeenCalled()

    resolveSet()
    await Promise.all([upserting, deleting])
    expect(removeLocalForageItem).toHaveBeenCalledTimes(4)
  })

  test('still deletes after a save fails', async () => {
    setLocalForageItem.mockRejectedValueOnce(new Error('Quota exceeded'))

    await expect(
      upsertAutoSaveData(1, 'my-key', { name: 'Blinky Bill' }),
    ).rejects.toThrow('Quota exceeded')
    await deleteAutoSaveData(1, 'my-key')

    expect(removeLocalForageItem).toHaveBeenCalledTimes(4)
  })
})
