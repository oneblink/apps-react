import {
  FormTypes,
  SubmissionEventTypes,
  SubmissionTypes,
  ScheduledTasksTypes,
} from '@oneblink/types'
import { FormElement } from '@oneblink/types/typescript/forms'

export { ProgressListener, ProgressListenerEvent } from '@oneblink/storage'

export type BaseNewFormSubmission = {
  /** The submission data */
  submission: SubmissionTypes.S3SubmissionData['submission']
  /** The form definition when the draft was saved */
  definition: FormTypes.Form
}

export type NewDraftSubmission = BaseNewFormSubmission & {
  /**
   * Set to true if the submission should be uploaded in the background, false
   * or undefined if the submission should be uploaded immediately
   */
  backgroundUpload?: boolean
  /** The element that was last updated before the draft was saved */
  lastElementUpdated?: FormElement
  /** The state of sections before the draft was saved */
  sectionState?: SubmissionTypes.NewS3SubmissionData['sectionState']
  /**
   * The elapsed duration in seconds the user took to complete the submission
   * before the draft was saved
   */

  previousElapsedDurationSeconds?: SubmissionTypes.NewS3SubmissionData['previousElapsedDurationSeconds']
}

export type NewFormSubmission = BaseNewFormSubmission & {
  /** The reCAPTCHA tokens to validate the submission */
  recaptchas?: Array<{
    /** The site key that was used to generate the reCAPTCHA token */
    siteKey: string
    /** A reCAPTCHA token */
    token: string
  }>
}

export type BaseFormSubmission = {
  /** The id of the job to submit */
  jobId?: string
  /** The id of the Forms App submitting for */
  externalId?: string
  /**
   * The id of the previous form submission approval id. Only used when the form
   * submission is in response to `CLARIFICATION_REQUIRED` approval.
   */
  previousFormSubmissionApprovalId?: string
  /**
   * Will have a value if the user was attempting to complete a scheduled task
   * via a form submission
   */
  taskCompletion?: {
    /** The task */
    task: ScheduledTasksTypes.Task
    /** The task action */
    taskAction: ScheduledTasksTypes.TaskAction
    /** The task group */
    taskGroup: ScheduledTasksTypes.TaskGroup | undefined
    /** The task group instance */
    taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance | undefined
    /**
     * The URL to redirect the user to after completing the task via form
     * submission
     */
    redirectUrl: string
  }
}

export type DraftSubmissionInput = NewDraftSubmission &
  BaseFormSubmission & {
    /** The id of the Forms App submitting for */
    formsAppId: number
    /** The title input by a user to identify the draft. */
    title: string
  }

export type DraftSubmission = DraftSubmissionInput & {
  /**
   * The date and time (in ISO format) when this version of the draft was
   * created.
   */
  createdAt: string
  /**
   * The identifier for the parent draft record. Created client side to store
   * the draft locally for offline capability
   */
  formSubmissionDraftId: string
}

export type LocalFormSubmissionDraft = Omit<
  SubmissionTypes.FormSubmissionDraft,
  'id' | 'versions'
> & {
  /**
   * The versions of the draft data. `undefined` if it has not been uploaded
   * remotely yet.
   */
  versions: SubmissionTypes.FormSubmissionDraftVersion[] | undefined
  /**
   * The draft submission data. `undefined` if it has not been downloaded
   * locally yet.
   */
  draftSubmission: DraftSubmission | undefined
  /** `true` if the draft was created by a public user (not logged in). */
  isPublic?: boolean
}

export type FormSubmission = NewFormSubmission &
  BaseFormSubmission & {
    /** The id of the Forms App submitting for */
    formsAppId?: number
    /** The id of the draft to clean up after successful submission */
    formSubmissionDraftId?: string
    /** The id of the prefill data to clean up after successful submission */
    preFillFormDataId: string | null
  }

export type FormSubmissionResult = FormSubmission & {
  /**
   * The identifier that represents the submission. `null` if the form
   * submission was unsuccessful
   */
  submissionId: string | null
  /**
   * The timestamp the form was submitted, `null` if the form submission was
   * unsuccessful
   */
  submissionTimestamp: string | null
  /** `null` if the form submission does not require a payment */
  payment: {
    /** The amount required to pay */
    amount: number
    /** The URL to redirect the user to after payment to display a receipt */
    paymentReceiptUrl: string
    /**
     * The URL to redirect the user to to make a payment for a form hosted by
     * customer instead of payment provider
     */
    paymentFormUrl: string | undefined
    /** The URL to redirect the user to to complete the payment process */
    hostedFormUrl: string
    /** The payment submission event */
    submissionEvent: SubmissionEventTypes.FormPaymentEvent
  } | null
  /** `null` if the form submission does not require a booking */
  scheduling: {
    /** The URL to redirect the user to to complete the booking process */
    bookingUrl: string
    /** The scheduling submission event */
    submissionEvent: SubmissionEventTypes.FormSchedulingEvent
  } | null
  /**
   * `true` if the submission was not submitted yet and was added to the pending
   * queue
   */
  isInPendingQueue: boolean
  /** `true` if the submission was attempted offline */
  isOffline: boolean
  /** True if the submission was attempted whilst attachments were uploading */
  isUploadingAttachments: boolean
  /** Exists if the form allows PDF download */
  /**
   * @deprecated Only returned when legacy post submission download
   *   configuration is in use. For non legacy configured forms, use
   *   `downloadSubmissionPdfs` instead.
   */
  downloadSubmissionPdfUrl?: string

  downloadSubmissionPdfs?: Array<{
    id: string
    configuration: SubmissionEventTypes.PDFConfiguration
    url: string
  }>
  /** The access token to download post-submission attachment urls and metadata. */
  attachmentsAccessToken?: string
}

export type PendingFormSubmission = FormSubmission & {
  /** The date and time (in ISO format) the submission was attempted */
  pendingTimestamp: string
  /** `true` if the submission is currently being processed by the pending queue */
  isSubmitting?: boolean
  /** `true` if the submission is currently being edited */
  isEditing?: boolean
  /**
   * An error message that might be set while attempting to process the
   * submission in the pending queue
   */
  error?: string
}
