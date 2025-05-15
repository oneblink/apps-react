import { Sentry } from "@oneblink/apps"

export const sendGoogleAnalyticsEvent = (
  eventName: string,
  eventParams: Record<string, unknown>,
) => {
  if (typeof window.gtag === 'function') {
    try {
      console.log('pushing event to google analytics: ', eventName, eventParams)
      window.gtag('event', eventName, eventParams)
    } catch (e) {
      console.warn('An error occured pushing event to google analytics: ', e)
      Sentry.captureException(e)
    }
  }
}
