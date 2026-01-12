import { isOffline } from '../offline-service'
import {
  addFormSubmissionToPendingQueue,
  deletePendingQueueSubmission,
} from './pending-queue'
import {
  checkForPaymentSubmissionEvent,
  handlePaymentSubmissionEvent,
} from '../payment-service'
import { removeLocalDraftSubmission } from './draft-data-store'
import { removePrefillFormData } from '../prefill-service'
import {
  handleSchedulingSubmissionEvent,
  checkForSchedulingSubmissionEvent,
} from './schedulingHandlers'
import {
  FormSubmission,
  FormSubmissionResult,
  ProgressListener,
  ProgressListenerEvent,
} from '../types/submissions'
import { SchedulingUrlConfiguration } from '../types/scheduling'
import { checkIfAttachmentsAreUploading } from '../attachments-service'
import tenants from '../tenants'
import externalIdGeneration from './external-id-generation'
import serverValidateForm from './server-validation'
import OneBlinkAppsError from './errors/oneBlinkAppsError'
import { uploadFormSubmission } from './api/submissions'
import { syncDrafts } from '../draft-service'

type SubmissionParams = {
  formSubmission: FormSubmission
  isPendingQueueEnabled: boolean
  shouldRunServerValidation: boolean
  shouldRunExternalIdGeneration: boolean
  paymentReceiptUrl: string | undefined
  paymentFormUrl: string | undefined
  schedulingUrlConfiguration?: SchedulingUrlConfiguration
  pendingTimestamp?: string
  alwaysSubmitViaPendingQueue?: boolean
  onProgress?: ProgressListener
  abortSignal?: AbortSignal
}

export { SubmissionParams, ProgressListener, ProgressListenerEvent }

export default async function submit({
  formSubmission,
  isPendingQueueEnabled,
  paymentReceiptUrl,
  paymentFormUrl,
  schedulingUrlConfiguration,
  onProgress,
  shouldRunServerValidation,
  shouldRunExternalIdGeneration,
  abortSignal,
  pendingTimestamp,
  alwaysSubmitViaPendingQueue,
  completionTimestamp,
}: SubmissionParams & {
  completionTimestamp: string
}): Promise<FormSubmissionResult> {
  const paymentSubmissionEventConfiguration =
    checkForPaymentSubmissionEvent(formSubmission)

  const schedulingSubmissionEvent =
    checkForSchedulingSubmissionEvent(formSubmission)

  try {
    if (pendingTimestamp) {
      await deletePendingQueueSubmission(pendingTimestamp)
    }
    if (isOffline() || alwaysSubmitViaPendingQueue) {
      if (paymentSubmissionEventConfiguration || schedulingSubmissionEvent) {
        console.log(
          'Offline or always submitting via pending queue - form has a payment/scheduling submission event that has not been processed yet, return offline',
          { paymentSubmissionEventConfiguration, schedulingSubmissionEvent },
        )
        return Object.assign({}, formSubmission, {
          isOffline: true,
          isInPendingQueue: false,
          submissionTimestamp: null,
          submissionId: null,
          payment: null,
          scheduling: null,
          isUploadingAttachments: false,
        })
      }

      if (!alwaysSubmitViaPendingQueue && !isPendingQueueEnabled) {
        console.log(
          'Offline - app does not support pending queue, return offline',
        )
        return Object.assign({}, formSubmission, {
          isOffline: true,
          isInPendingQueue: false,
          submissionTimestamp: null,
          submissionId: null,
          payment: null,
          scheduling: null,
          isUploadingAttachments: false,
        })
      }

      console.log(
        'Offline or always submitting via pending queue - saving submission to pending queue..',
      )
      await addFormSubmissionToPendingQueue(formSubmission)
      return Object.assign({}, formSubmission, {
        isOffline: isOffline(),
        isInPendingQueue: true,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
        preventPayment: false,
        scheduling: null,
        isUploadingAttachments: false,
      })
    }

    const attachmentsStillUploading = checkIfAttachmentsAreUploading(
      formSubmission.definition,
      formSubmission.submission,
    )

    if (attachmentsStillUploading) {
      if (paymentSubmissionEventConfiguration || schedulingSubmissionEvent) {
        console.log(
          'Attachments still uploading - form has a payment/scheduling submission event that has not been processed yet, return isUploading',
          { paymentSubmissionEventConfiguration, schedulingSubmissionEvent },
        )
        return Object.assign({}, formSubmission, {
          isOffline: false,
          isInPendingQueue: false,
          submissionTimestamp: null,
          submissionId: null,
          payment: null,
          preventPayment: false,
          scheduling: null,
          isUploadingAttachments: true,
        })
      }
      console.log(
        'Attachments still uploading - saving submission to pending queue..',
      )
      await addFormSubmissionToPendingQueue(formSubmission)
      return Object.assign({}, formSubmission, {
        isOffline: false,
        isInPendingQueue: true,
        submissionTimestamp: null,
        submissionId: null,
        payment: null,
        preventPayment: false,
        scheduling: null,
        isUploadingAttachments: true,
      })
    }

    if (shouldRunServerValidation) {
      await serverValidateForm(formSubmission)
    }
    if (shouldRunExternalIdGeneration) {
      const externalIdResult = await externalIdGeneration(formSubmission)
      if (externalIdResult.externalId) {
        formSubmission.externalId = externalIdResult.externalId
      }
    }

    const data = await uploadFormSubmission(
      formSubmission,
      completionTimestamp,
      onProgress,
      abortSignal,
    )

    const getDownloadSubmissionPdfUrls = () => {
      const allowPDFDownload =
        formSubmission.definition.postSubmissionReceipt?.allowPDFDownload
      if (!data.pdfAccessToken || !allowPDFDownload) {
        return {
          downloadSubmissionPdfUrl: undefined,
          downloadSubmissionPdfs: undefined,
        }
      }
      if (allowPDFDownload && !Array.isArray(allowPDFDownload)) {
        // Cater for legacy config
        const url = `${tenants.current.apiOrigin}/forms/${formSubmission.definition.id}/submissions/${data.submissionId}/pdf-document?accessToken=${data.pdfAccessToken}`
        return {
          downloadSubmissionPdfUrl: url,
          downloadSubmissionPdfs: [
            {
              id: 'default',
              configuration: allowPDFDownload,
              url,
            },
          ],
        }
      }

      return {
        downloadSubmissionPdfUrl: undefined,
        downloadSubmissionPdfs: allowPDFDownload.map((pdfConfiguration) => {
          const url = `${tenants.current.apiOrigin}/forms/${formSubmission.definition.id}/submissions/${data.submissionId}/pdf-document?accessToken=${data.pdfAccessToken}&configurationId=${pdfConfiguration.id}`
          return {
            ...pdfConfiguration,
            url,
          }
        }),
      }
    }

    const { downloadSubmissionPdfUrl, downloadSubmissionPdfs } =
      getDownloadSubmissionPdfUrls()

    const formSubmissionResult: FormSubmissionResult = {
      ...formSubmission,
      payment: null,
      scheduling: null,
      isOffline: false,
      isInPendingQueue: false,
      submissionTimestamp: data.submissionTimestamp,
      submissionId: data.submissionId,
      isUploadingAttachments: false,
      downloadSubmissionPdfUrl,
      downloadSubmissionPdfs,
      attachmentsAccessToken: data.attachmentsAccessToken,
    }

    if (schedulingSubmissionEvent && schedulingUrlConfiguration) {
      formSubmissionResult.scheduling = await handleSchedulingSubmissionEvent({
        formSubmissionResult,
        schedulingSubmissionEvent,
        schedulingUrlConfiguration,
        paymentReceiptUrl,
        paymentFormUrl,
        preventPayment: data.preventPayment,
      })
    } else if (
      paymentSubmissionEventConfiguration &&
      paymentReceiptUrl &&
      !data.preventPayment
    ) {
      formSubmissionResult.payment = await handlePaymentSubmissionEvent({
        ...paymentSubmissionEventConfiguration,
        formSubmissionResult,
        paymentReceiptUrl,
        paymentFormUrl,
      })
    }

    //currently cannot have drafts without a forms app
    if (formSubmission.formSubmissionDraftId && formSubmission.formsAppId) {
      await removeLocalDraftSubmission(formSubmission.formSubmissionDraftId)
      syncDrafts({
        formsAppId: formSubmission.formsAppId,
        throwError: false,
      })
    }
    if (formSubmission.preFillFormDataId) {
      await removePrefillFormData(formSubmission.preFillFormDataId)
    }

    return formSubmissionResult
  } catch (error: OneBlinkAppsError | unknown) {
    if (error instanceof OneBlinkAppsError) {
      if (error.isOffline) {
        if (
          !isPendingQueueEnabled ||
          schedulingSubmissionEvent ||
          paymentSubmissionEventConfiguration
        ) {
          console.warn(
            'Offline error thrown - app or form does not support pending queue, return offline',
            error,
          )
          return Object.assign({}, formSubmission, {
            isOffline: true,
            isInPendingQueue: false,
            submissionTimestamp: null,
            submissionId: null,
            payment: null,
            scheduling: null,
            isUploadingAttachments: false,
            preventPayment: false,
          })
        }

        console.warn(
          'Offline error thrown - saving submission to pending queue..',
          error,
        )
        await addFormSubmissionToPendingQueue(formSubmission)
        return Object.assign({}, formSubmission, {
          isOffline: true,
          isInPendingQueue: true,
          submissionTimestamp: null,
          submissionId: null,
          payment: null,
          scheduling: null,
          isUploadingAttachments: false,
          preventPayment: false,
        })
      }

      // If the error has already been handled as a
      // OneBlinkAppsError, we can throw it as is.
      throw error
    }

    throw new OneBlinkAppsError(
      'An error has occurred with your submission, please contact Support if this problem persists.',
      {
        title: 'Unexpected Error',
        originalError: error as Error,
      },
    )
  }
}
