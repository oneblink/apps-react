import * as React from 'react'
import { differenceInSeconds } from 'date-fns'

export default function useFormSubmissionDuration(
  initialPreviousElapsedDurationSeconds?: number,
) {
  // a "seconds" value indicating the previous time spent on this form submission
  const [previousElapsedDurationSeconds, setPreviousElapsedDurationSeconds] =
    React.useState<number | undefined>(initialPreviousElapsedDurationSeconds)
  const startTime = React.useRef(Date.now())

  // return the current submission duration in seconds
  const getCurrentSubmissionDuration = React.useCallback(() => {
    const currentSessionDuration = differenceInSeconds(Date.now(), startTime.current)
    return currentSessionDuration + (previousElapsedDurationSeconds || 0)
  }, [previousElapsedDurationSeconds])

  const resetCurrentSubmissionDuration = React.useCallback(
    (newPreviousElapsedDurationSeconds?: number) => {
      setPreviousElapsedDurationSeconds(newPreviousElapsedDurationSeconds)
      startTime.current = Date.now()
    },
    [],
  )

  return [getCurrentSubmissionDuration, resetCurrentSubmissionDuration] as const
}
