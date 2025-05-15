export const sendGoogleAnalyticsEvent = (
  eventName: string,
  eventParams: Record<string, unknown>,
) => {
  if (typeof window.gtag === 'function') {
    console.log('pushing event to google analytics: ', eventName, eventParams)
    window.gtag('event', eventName, eventParams)
  }
}
