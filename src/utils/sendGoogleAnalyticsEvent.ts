import { Sentry } from '../apps'
import { FormTypes } from '@oneblink/types'

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

export const getElementDisplayNameForAnalyticsEvent = (
  lastElementUpdated?: FormTypes.FormElement | null,
) => {
  if (!lastElementUpdated) return
  return lastElementUpdated && 'label' in lastElementUpdated
    ? lastElementUpdated.label
    : lastElementUpdated?.name || lastElementUpdated?.id
}
