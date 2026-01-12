import { ScheduledTasksTypes } from '@oneblink/types'
import tenants from './tenants'
import Sentry from './Sentry'
import {
  HTTPError,
  deleteRequest,
  getRequest,
  postRequest,
} from './services/fetch'
import { isOffline } from './offline-service'
import OneBlinkAppsError from './services/errors/oneBlinkAppsError'

export interface TaskAvailability {
  task: ScheduledTasksTypes.Task
  completedTask?: ScheduledTasksTypes.CompletedTask
  daysAvailable: number
}

export interface TaskResponse extends TaskAvailability {
  actions: ScheduledTasksTypes.TaskAction[]
}

async function getTasks<
  T extends {
    taskResponses: TaskResponse[]
  },
>(url: string, abortSignal?: AbortSignal) {
  try {
    return await getRequest<T>(url, abortSignal)
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local version of these scheduled tasks, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the forms app you are looking for. Please contact support if the problem persists.',
          {
            originalError: error,
            title: 'Unknown Forms App',
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
  }
}

/**
 * Obtain all of the related Tasks for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const date = '2023-12-01'
 * const tasks = await getTasksForFormsApp({ formsAppId, date })
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
export async function getTasksForFormsApp({
  formsAppId,
  date,
  abortSignal,
}: {
  formsAppId: number
  date: string
  abortSignal?: AbortSignal
}): Promise<{
  taskResponses: TaskResponse[]
}> {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-tasks?date=${date}`
  return await getTasks(url, abortSignal)
}

/**
 * Obtain all of the tasks related to a Task Group Instances in a specific Forms
 * App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const taskGroupInstanceId = 'abc123'
 * const date = '2023-12-01'
 * const tasks = await getTaskGroupInstanceTasks({
 *   formsAppId,
 *   taskGroupInstanceId,
 *   date,
 * })
 * ```
 *
 * @param formsAppId
 * @param taskGroupInstanceId
 * @param abortSignal
 * @returns
 */
export async function getTaskGroupInstanceTasks({
  taskGroupInstanceId,
  date,
  formsAppId,
  abortSignal,
}: {
  taskGroupInstanceId: string
  date: string
  formsAppId: number
  abortSignal?: AbortSignal
}) {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-task-group-instances/${taskGroupInstanceId}?date=${date}`
  return await getTasks<{
    taskResponses: TaskResponse[]
    taskGroup: ScheduledTasksTypes.TaskGroup
    taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance
  }>(url, abortSignal)
}

/**
 * Obtain all of the Task Group instances for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const taskGroupInstances = await getTaskGroupInstances(formsAppId)
 * ```
 *
 * @param formsAppId
 * @param abortSignal
 * @returns
 */
export async function getTaskGroupInstances(
  formsAppId: number,
  abortSignal?: AbortSignal,
) {
  const url = `${tenants.current.apiOrigin}/forms-apps/${formsAppId}/scheduled-task-group-instances`
  try {
    return await getRequest<{
      taskGroupInstances: Array<
        ScheduledTasksTypes.TaskGroupInstance & {
          taskAvailabilities: TaskAvailability[]
          taskGroup: ScheduledTasksTypes.TaskGroup
        }
      >
    }>(url, abortSignal)
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline and do not have a local version of these scheduled task groups, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 400:
      case 404: {
        throw new OneBlinkAppsError(
          'We could not find the forms app you are looking for. Please contact support if the problem persists.',
          {
            originalError: error,
            title: 'Unknown Forms App',
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
  }
}

/**
 * Complete the related Task for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const taskId = 2
 * const completedTask = await scheduledTasksService.completeTask({
 *   formsAppId,
 *   taskId,
 * })
 * ```
 *
 * @param options
 * @returns
 */

export async function completeTask({
  formsAppId,
  taskId,
  taskActionId,
  taskGroupInstanceId,
  abortSignal,
}: {
  formsAppId: number
  taskId: string
  taskActionId: string
  taskGroupInstanceId: string | undefined
  abortSignal?: AbortSignal
}): Promise<ScheduledTasksTypes.CompletedTask> {
  const url = `${tenants.current.apiOrigin}/completed-tasks`
  try {
    return await postRequest<ScheduledTasksTypes.CompletedTask>(
      url,
      { formsAppId, taskId, taskActionId, taskGroupInstanceId },
      abortSignal,
    )
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to complete this task. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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
  }
}

/**
 * Delete the completed task record related to a Task for a specific Forms App
 *
 * #### Example
 *
 * ```js
 * const formsAppId = 1
 * const taskId = 2
 * const completedTask = await scheduledTasksService.completeTask({
 *   formsAppId,
 *   taskId,
 * })
 * await deleteCompletedTask(completedTask.id)
 * ```
 *
 * @param id
 * @param abortSignal
 * @returns
 */

export async function deleteCompletedTask(
  id: string,
  abortSignal?: AbortSignal,
): Promise<void> {
  const url = `${tenants.current.apiOrigin}/completed-tasks/${id}`
  try {
    await deleteRequest(url, abortSignal)
  } catch (err) {
    Sentry.captureException(err)

    const error = err as HTTPError
    if (isOffline()) {
      throw new OneBlinkAppsError(
        'You are currently offline, please connect to the internet and try again',
        {
          originalError: error,
          isOffline: true,
        },
      )
    }
    switch (error.status) {
      case 403: {
        throw new OneBlinkAppsError(
          'You do not have access to delete completed tasks. Please contact your administrator to gain the correct level of access.',
          {
            originalError: error,
            requiresAccessRequest: true,
            httpStatusCode: error.status,
          },
        )
      }
      case 400:
      case 404: {
        throw new OneBlinkAppsError(error.message, {
          title: 'Invalid Request',
          httpStatusCode: error.status,
        })
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
  }
}
