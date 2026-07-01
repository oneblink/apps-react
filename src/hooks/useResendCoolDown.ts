import * as React from 'react'

/**
 * Returns the number of seconds remaining before a resend action can be
 * performed again.
 */
export default function useResendCoolDown(
  sentAt: number | undefined,
  coolDownSeconds: number,
) {
  const [now, setNow] = React.useState(() => Date.now())

  const remainingSeconds = React.useMemo(() => {
    if (!sentAt) {
      return 0
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - sentAt) / 1000))
    return Math.max(0, coolDownSeconds - elapsedSeconds)
  }, [coolDownSeconds, now, sentAt])

  React.useEffect(() => {
    if (!sentAt) {
      return
    }

    setNow(Date.now())

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [sentAt])

  return remainingSeconds
}
