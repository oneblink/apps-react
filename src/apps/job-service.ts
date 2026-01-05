import _orderBy from 'lodash.orderby'

import OneBlinkAppsError from './services/errors/oneBlinkAppsError'
import { searchRequest } from './services/fetch'
import { getPendingQueueSubmissions } from './services/pending-queue'
import { ensurePrefillFormDataExists } from './services/job-prefill'
import { isOffline } from './offline-service'
import { isLoggedIn } from './auth-service'
import { getDrafts } from './draft-service'
import tenants from './tenants'
import { SubmissionTypes } from '@oneblink/types'
import Sentry from './Sentry'

async function removePendingSubmissions(
  jobList: SubmissionTypes.FormsAppJob[],
) {
  // Get list of pending submissions, remove jobs that are in the pending queue
  return getPendingQueueSubmissions().then((submissions) => {
    const unprocessedJobs = jobList.filter(
      (job) => !submissions.some((sub) => sub.jobId === job.id),
    )
    return unprocessedJobs
  })
}

async function tagDrafts(jobList: SubmissionTypes.FormsAppJob[]) {
  return getDrafts().then((drafts) =>
    jobList.map((job) => {
      const draft = drafts.find((draft) => draft.jobId === job.id)
      return {
        ...job,
        draft,
      }
    }),
  )
}

/**
 * Get Jobs for the current user. Jobs that are in the pending queue will be
 * filtered out and Jobs with drafts will include the `draft` property.
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const label = 'Applications'
 * const jobs = await jobService.getJobs(formsAppId, label)
 * ```
 *
 * @param formsAppId
 * @param jobsLabel
 * @returns
 */
export async function getJobs(
  formsAppId: number,
  jobsLabel: string,
): Promise<SubmissionTypes.FormsAppJob[]> {
  if (!isLoggedIn()) {
    return []
  }

  return searchRequest<{ jobs: Array<SubmissionTypes.FormsAppJob> }>(
    `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/jobs`,
    {
      isSubmitted: false,
    },
  )
    .then((data) => removePendingSubmissions(data.jobs))
    .then((jobs) => tagDrafts(jobs))
    .then((jobList) =>
      _orderBy(
        jobList,
        ['details.priority', (job) => Date.parse(job.createdAt)],
        ['asc', 'asc'],
      ),
    )
    .catch((error) => {
      Sentry.captureException(error)
      console.warn('Error retrieving Jobs for forms app', error)

      if (isOffline()) {
        throw new OneBlinkAppsError(
          'You are currently offline and do not have a local copy of this app available, please connect to the internet and try again',
          {
            originalError: error,
            isOffline: true,
          },
        )
      }

      switch (error.status) {
        case 401: {
          throw new OneBlinkAppsError(
            `You need to log in to see your ${jobsLabel}. Please login and try again.`,
            {
              originalError: error,
              requiresLogin: true,
              httpStatusCode: error.status,
            },
          )
        }
        case 403: {
          throw new OneBlinkAppsError(
            `You have not been granted access to ${jobsLabel}. Please contact your administrator to gain the correct level of access.`,
            {
              originalError: error,
              requiresAccessRequest: true,
              httpStatusCode: error.status,
            },
          )
        }
        case 400:
        case 404: {
          throw new OneBlinkAppsError(
            'We could not find the application you are looking for. Please contact your administrator to ensure your application configuration has been completed successfully.',
            {
              originalError: error,
              title: 'Unknown Application',
              httpStatusCode: error.status,
            },
          )
        }
        default: {
          throw new OneBlinkAppsError(
            'An unknown error has occurred. Please contact support if the problem persists.',
            {
              originalError: error,
              httpStatusCode: error.status,
            },
          )
        }
      }
    })
}

export { ensurePrefillFormDataExists }
