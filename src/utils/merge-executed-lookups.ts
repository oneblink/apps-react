import { SubmissionTypes } from '@oneblink/types'
import { ExecutedLookups } from '../types/form'

export default function mergeExecutedLookups({
  dataLookupResult,
  currentSubmission,
  executedLookups,
}: {
  dataLookupResult: SubmissionTypes.S3SubmissionData['submission'] | undefined
  currentSubmission: SubmissionTypes.S3SubmissionData['submission'] | undefined
  executedLookups: ExecutedLookups
}): ExecutedLookups {
  if (!dataLookupResult) {
    return executedLookups
  }

  const updatedExecutedLookups = { ...executedLookups }
  for (const [key, value] of Object.entries(dataLookupResult)) {
    if (Array.isArray(value)) {
      updatedExecutedLookups[key] = value.map((entry, index) => {
        const elementExecutedLookups =
          (executedLookups?.[key] as ExecutedLookups[]) ?? []
        const elementValue = Array.isArray(currentSubmission?.[key])
          ? (currentSubmission?.[
              key
            ] as SubmissionTypes.S3SubmissionData['submission'][])
          : []
        return mergeExecutedLookups({
          dataLookupResult: entry,
          currentSubmission: elementValue[index],
          executedLookups: elementExecutedLookups[index] ?? {},
        })
      })
      continue
    }
    if (Object(value) === value) {
      updatedExecutedLookups[key] = mergeExecutedLookups({
        dataLookupResult:
          value as SubmissionTypes.S3SubmissionData['submission'],
        currentSubmission: currentSubmission?.[
          key
        ] as SubmissionTypes.S3SubmissionData['submission'],
        executedLookups: (updatedExecutedLookups[key] as ExecutedLookups) ?? {},
      })
      continue
    }
    updatedExecutedLookups[key] =
      updatedExecutedLookups[key] === true && value === currentSubmission?.[key]
  }
  return updatedExecutedLookups
}
