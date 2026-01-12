/**
 * ## Offline Service
 *
 * Helper functions for offline handling
 *
 * ```js
 * import { offlineService } from '@oneblink/apps'
 * ```
 */
export * as offlineService from './offline-service'
/**
 * ## Authentication/Authorisation Service
 *
 * Helper functions for handling user authentication and authorisation.
 *
 * **NOTE: `init()` must be called before using some of the functions in this
 * service.**
 *
 * ```js
 * import { authService } from '@oneblink/apps'
 * ```
 */
export * as authService from './auth-service'
/**
 * ## Draft Service
 *
 * Helper functions for handling drafts.
 *
 * ```js
 * import { draftService } from '@oneblink/apps'
 * ```
 */
export * as draftService from './draft-service'
/**
 * ## Prefill Service
 *
 * Helper functions for offline handling
 *
 * ```js
 * import { prefillService } from '@oneblink/apps'
 * ```
 */
export * as prefillService from './prefill-service'
/**
 * ## Payment Service
 *
 * Helper functions for payment handling
 *
 * ```js
 * import { paymentService } from '@oneblink/apps'
 * ```
 */
export * as paymentService from './payment-service'
/**
 * ## Scheduling Service
 *
 * Helper functions for scheduling booking handling
 *
 * ```js
 * import { schedulingService } from '@oneblink/apps'
 * ```
 */
export * as schedulingService from './scheduling-service'
/**
 * ## Job Service
 *
 * Helper functions for job handling
 *
 * ```js
 * import { jobService } from '@oneblink/apps'
 * ```
 */
export * as jobService from './job-service'
/**
 * ## Submission Service
 *
 * Helper functions for handling form submissions
 *
 * ```js
 * import { submissionService } from '@oneblink/apps'
 * ```
 */
export * as submissionService from './submission-service'
/**
 * ## Auto Save Service
 *
 * Helper functions for handling data while user is completing form.
 *
 * ```js
 * import { autoSaveService } from '@oneblink/apps'
 * ```
 */
export * as autoSaveService from './auto-save-service'
/**
 * ## Notification Service
 *
 * Helper functions for notification handling
 *
 * ```js
 * import { notificationService } from '@oneblink/apps'
 * ```
 *
 * ### Service Worker
 *
 * To display push notifications and allow them to be clicked to open the
 * application, add the following JavaScript to your service worker (we
 * recommend using
 * [offline-plugin](https://www.npmjs.com/package/offline-plugin)):
 *
 * #### Example
 *
 * ```js
 * self.addEventListener('push', (event) => {
 *   console.log('push event', event)
 *
 *   if (!event.data) {
 *     console.log('Received push event without any data', event)
 *     return
 *   }
 *   const notification = event.data.json()
 *
 *   event.waitUntil(
 *     clients.matchAll().then((c) => {
 *       if (c.length === 0 || c.every((client) => !client.focused)) {
 *         // Show notification
 *         return self.registration.showNotification(
 *           notification.title,
 *           notification.options,
 *         )
 *       } else {
 *         console.log('Application is already open!')
 *       }
 *     }),
 *   )
 * })
 *
 * self.addEventListener('notificationclick', (event) => {
 *   console.log('notification click event', event)
 *
 *   const pathname =
 *     event.notification.data && event.notification.data.pathname
 *       ? event.notification.data.pathname
 *       : '/'
 *
 *   event.waitUntil(
 *     clients.matchAll().then((clis) => {
 *       const client = clis[0]
 *       if (client === undefined) {
 *         // there are no visible windows. Open one.
 *         clients.openWindow(pathname)
 *       } else {
 *         client.navigate(pathname)
 *         client.focus()
 *       }
 *
 *       return self.registration
 *         .getNotifications()
 *         .then((notifications) => {
 *           notifications.forEach((notification) => {
 *             notification.close()
 *           })
 *         })
 *     }),
 *   )
 * })
 * ```
 */
export * as notificationService from './notification-service'
/**
 * ## Form Service
 *
 * Helper functions for form handling
 *
 * ```js
 * import { formService } from '@oneblink/apps'
 * ```
 */
export * as formService from './form-service'
/**
 * ## Approvals Service
 *
 * Helper functions for handling approvals
 *
 * ```js
 * import { approvalsService } from '@oneblink/apps'
 * ```
 */
export * as approvalsService from './approvals-service'
/**
 * ## Forms App Service
 *
 * Helper functions for forms apps
 *
 * ```js
 * import { formsAppService } from '@oneblink/apps'
 * ```
 */
export * as formsAppService from './forms-app-service'
/**
 * ## Form Store Service
 *
 * Helper functions for handling Form Store Records
 *
 * ```js
 * import { formStoreService } from '@oneblink/apps'
 * ```
 */
export * as formStoreService from './form-store-service'
/**
 * ## Localisation Service
 *
 * Helper functions for handling all things locale.
 *
 * ```js
 * import { localisationService } from '@oneblink/apps'
 * ```
 */
export * as localisationService from './localisation-service'
/**
 * ## Attachments Service
 *
 * Helper functions for attachment handling
 *
 * ```js
 * import { attachmentsService } from '@oneblink/apps'
 * ```
 */
export * as attachmentsService from './attachments-service'
/**
 * ## Scheduled Tasks Service
 *
 * Helper functions for scheduled tasks
 *
 * ```js
 * import { scheduledTasksService } from '@oneblink/apps'
 * ```
 */
export * as scheduledTasksService from './scheduled-tasks-service'
/**
 * ## Forms App Environment Service
 *
 * Helper functions for forms app environments
 *
 * ```js
 * import { formsAppEnvironmentService } from '@oneblink/apps'
 * ```
 */
export * as formsAppEnvironmentService from './forms-app-environment-service'

export { default as OneBlinkAppsError } from './services/errors/oneBlinkAppsError'
import tenants from './tenants'
export { default as Sentry } from './Sentry'

export const useTenantCivicPlus = () => tenants.useCivicPlus()
export const useTenantOneBlink = () => tenants.useOneBlink()
