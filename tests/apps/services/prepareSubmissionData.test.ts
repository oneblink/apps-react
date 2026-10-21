import { describe, expect, test } from 'vitest'
import { copySubmissionData } from '../../../src/apps/services/prepareSubmissionData'

describe('copySubmissionData', () => {
  test('copies arrays and plain objects but keeps other values shared', () => {
    const blob = new Blob(['data'])
    const submission = {
      files: [{ fileName: 'a.txt', data: blob }],
      entries: [{ camera: { fileName: 'b.png', data: blob } }],
      text: 'value',
    }
    const copy = copySubmissionData(submission)

    expect(copy).toEqual(submission)
    expect(copy).not.toBe(submission)
    expect(copy.files).not.toBe(submission.files)
    expect(copy.files[0]).not.toBe(submission.files[0])
    expect(copy.entries[0].camera).not.toBe(submission.entries[0].camera)
    expect(copy.files[0].data).toBe(blob)
  })
})
