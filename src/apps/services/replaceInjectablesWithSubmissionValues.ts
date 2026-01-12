import { FormSubmissionResult } from '../types/submissions'
import * as localisationService from '../localisation-service'
import { getUserProfile } from '../auth-service'

export default function replaceInjectablesWithSubmissionValues(
  text: string,
  submissionResult: FormSubmissionResult,
): ReturnType<
  typeof localisationService.replaceInjectablesWithSubmissionValues
> {
  return localisationService.replaceInjectablesWithSubmissionValues(text, {
    previousApprovalId: submissionResult.previousFormSubmissionApprovalId,
    form: submissionResult.definition,
    submission: submissionResult.submission,
    submissionId: submissionResult.submissionId || '',
    submissionTimestamp: submissionResult.submissionTimestamp || '',
    externalId: submissionResult.externalId || undefined,
    userProfile: getUserProfile() || undefined,
    task: submissionResult.taskCompletion?.task,
    taskGroup: submissionResult.taskCompletion?.taskGroup,
    taskGroupInstance: submissionResult.taskCompletion?.taskGroupInstance,
  })
}
