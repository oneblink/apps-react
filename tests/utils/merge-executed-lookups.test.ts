import { expect, it, describe } from 'vitest'
import mergeExecutedLookups from '../../src/utils/merge-executed-lookups'

describe('mergeExecutedLookups', () => {
  it('should merge executedLookups with dataLookupResult', () => {
    const dataLookupResult = {
      root: 'carrot',
      submarine: {
        label: 'UB40',
        periscope: [
          {
            position: 'down',
            identifiedObjects: [
              {
                label: 'battleship',
              },
              { label: 'whale' },
            ],
          },
        ],
      },
      crew: [
        {
          name: 'matt',
          rank: 'cabin boy',
        },
        { name: 'Dave', rank: 'Captain' },
      ],
    }

    const currentSubmission = {
      root: 'carrot',
      submarine: {
        label: 'UB41',
        periscope: [
          {
            position: 'up',
            identifiedObjects: [
              {
                label: 'battleship',
              },
              { label: 'dolphin' },
            ],
          },
        ],
      },
      crew: [
        {
          name: 'matt',
          rank: 'Capitan',
        },
        { name: 'Dave', rank: 'Lieutenant' },
      ],
    }

    const executedLookups = {
      root: true,
      other: true,
      submarine: {
        label: true,
        manufacturer: false,
        periscope: [
          {
            position: false,
            identifiedObjects: [
              {
                label: false,
              },
              { label: true },
            ],
          },
        ],
      },
      crew: [
        {
          name: false,
          rank: true,
        },
        { name: false, rank: false },
      ],
    }
    expect(
      mergeExecutedLookups({
        dataLookupResult,
        currentSubmission,
        executedLookups,
      }),
    ).toEqual({
      root: true,
      other: true,
      submarine: {
        label: false,
        manufacturer: false,
        periscope: [
          {
            position: false,
            identifiedObjects: [
              {
                label: false,
              },
              { label: false },
            ],
          },
        ],
      },
      crew: [
        {
          name: false,
          rank: false,
        },
        { name: false, rank: false },
      ],
    })
  })

  it('should not change a field if the value has not changed', () => {
    const dataLookupResult = {
      value: 'dog',
    }
    const currentSubmission = {
      value: 'dog',
    }
    const executedLookups = {
      value: true,
    }
    expect(
      mergeExecutedLookups({
        dataLookupResult,
        currentSubmission,
        executedLookups,
      }),
    ).toEqual({ value: true })
  })

  it('should not set an executedLookup as true if it was not already true', () => {
    const dataLookupResult = {
      value: 'dog',
    }
    const currentSubmission = {
      value: 'dog',
    }
    const executedLookups = {
      value: false,
    }
    expect(
      mergeExecutedLookups({
        dataLookupResult,
        currentSubmission,
        executedLookups,
      }),
    ).toEqual({ value: false })
  })
})
