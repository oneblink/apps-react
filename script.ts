type Submission = {
  [name: string]: unknown
}

const flattenSetEntries = (
  submissionValue: Array<unknown>,
  property?: string,
) => {
  const entryValues: unknown[] = []
  console.log('RECURSIVE FN -', property, submissionValue)
  for (const valueContext of submissionValue) {
    // If valueContext is an array of repeatable set entries
    if (Array.isArray(valueContext)) {
      entryValues.push(...flattenSetEntries(valueContext, property))
      // If valueContext is a repeatable set entry
    } else if (typeof valueContext === 'object' && !!valueContext) {
      // @ts-expect-error 123x
      const v = property ? valueContext[property] : valueContext
      if (Array.isArray(v)) {
        entryValues.push(...flattenSetEntries(v))
      } else {
        entryValues.push(v)
      }
    }
  }
  return entryValues
}

const getRepeatableSetEntries = (path: string[], submission: Submission) => {
  return path.reduce<undefined | unknown>(
    (submissionValue, property: string) => {
      // console.log('submissionValue - ', submissionValue)
      if (Array.isArray(submissionValue)) {
        // Make self calling function
        // const entryValues: unknown[] = []
        // for (const valueContext of submissionValue) {
        //   // If valueContext is an array of repeatable set entries
        //   if (Array.isArray(valueContext)) {
        //     for (const entry of valueContext) {
        //       //console.log('entry - ', entry, property)
        //       if (typeof entry === 'object' && !!entry) {
        //         entryValues.push(entry[property])
        //       }
        //     }
        //     // If valueContext is a repeatable set entry
        //   } else if (typeof valueContext === 'object' && !!valueContext) {
        //     entryValues.push(valueContext[property])
        //   }
        // }
        // return entryValues
        const result = flattenSetEntries(submissionValue, property)
        console.log('Recursive result -', result)
        return result
        // End self calling function
      }

      const nextValue =
        typeof submissionValue === 'object' && !!submissionValue
          ? (submissionValue as Submission)[property]
          : undefined
      return Array.isArray(nextValue) ? nextValue : undefined
      // return undefined
    },
    submission,
  ) as unknown[]
}

const fn = () => {
  const path = ['Set1', 'Set2', 'Set3', 'Role']
  const submission = {
    root: '',
    stuff: '',
    Set1: [
      {
        Name: 'Zac',
        Age: 28,
        Set2: [
          {
            Type: 'Sport',
            Name: 'Cricket',
            Set3: [
              {
                Role: 'Bowler',
                Type: 'Fast',
              },
              {
                Role: 'Batsmen',
                Type: 'Defensive',
              },
              {
                Role: 'Fielder',
                Position: 'Point',
              },
            ],
          },
          {
            Type: 'Gaming',
            Name: 'Skyrim',
            Set3: [
              {
                Role: 'Imperial',
                Type: 'Paladin',
              },
              {
                Role: 'Wood Elf',
                Type: 'Ranger',
              },
              {
                Role: 'Breton',
                Position: 'Death Knight',
              },
            ],
          },
        ],
      },
    ],
  }
  const entries = getRepeatableSetEntries(path.slice(0, -1), submission)
  console.log('RESULT ----------', entries)
}

fn()
