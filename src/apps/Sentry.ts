import * as Sentry from '@sentry/browser'
import tenants from './tenants'

export default {
  init: (formsAppId: number, options: Sentry.BrowserOptions) => {
    Sentry.init({
      integrations: [Sentry.browserTracingIntegration()],
      ...options,
    })
    Sentry.setTag('hostname', window.location.hostname)
    Sentry.setTag('tenant', tenants.tenant)
    Sentry.setTag('formsAppId', formsAppId)
  },
  captureException: Sentry.captureException,
  setTag: Sentry.setTag,
}
