import { FormTypes } from '@oneblink/types'
import { getSchedulingFormSubmissionResult } from '../../src/apps/scheduling-service'
import { getSchedulingSubmissionResult } from '../../src/apps/services/schedulingHandlers'
import { handlePaymentSubmissionEvent } from '../../src/apps/payment-service'
import { expect, describe, it, vi } from 'vitest'

vi.mock('../../src/apps/services/schedulingHandlers')
vi.mock(import('../../src/apps/payment-service'), async (importOriginal) => ({
  ...(await importOriginal()),
  handlePaymentSubmissionEvent: vi.fn(),
}))

const formDefinition: FormTypes.Form = {
  id: 1,
  name: 'Form',
  description: 'A form',
  organisationId: 'ORGANISATION_ID',
  formsAppEnvironmentId: 1,
  formsAppIds: [],
  elements: [
    {
      type: 'calculation',
      id: 'ELEMENT_ID',
      name: 'calc',
      label: 'Calculon',
      conditionallyShow: false,
      defaultValue: '10',
      calculation: '10',
    },
  ],
  submissionEvents: [],
  schedulingEvents: [
    {
      type: 'NYLAS',
      configuration: {
        nylasGrantId: 'grant1',
        nylasConfigurationId: 'config1',
      },
    },
  ],
  paymentEvents: [
    {
      type: 'WESTPAC_QUICK_STREAM',
      configuration: {
        elementId: 'ELEMENT_ID',
        environmentId: 'ENVIRONMENT_ID',
        customerReferenceNumber: 'crn',
      },
    },
  ],
  tags: [],
  isAuthenticated: true,
  isMultiPage: false,
  postSubmissionAction: 'BACK',
  cancelAction: 'BACK',
  createdAt: '',
  updatedAt: '',
}

const SUBMISSION_ID = 'abc123'

describe('sheduling service', () => {
  describe('getSchedulingFormSubmissionResult', () => {
    it('should throw an error if scheduling result config not found', () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue(null)
      expect(
        getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a scheduling receipt for an unknown booking.',
      )
    })

    it('should fail if there is no formSubmissionResult', () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        //@ts-expect-error setting to empty for test
        formSubmissionResult: null,
      })

      expect(
        getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
      )
    })

    it('should fail if formSubmissionResult scheduling prop is falsey', () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        preventPayment: false,
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: null,
          payment: null,
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
      )
    })

    it('should fail if formSubmissionResult scheduling.submissionEvent is falsey', () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            //@ts-expect-error
            submissionEvent: null,
          },
          payment: null,
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a scheduling receipt for a misconfigured booking.',
      )
    })

    it('should throw if submissionId and formSubmissionResult.submissionId are mismatched', () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        preventPayment: false,
        formSubmissionResult: {
          submissionId: 'def456',
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            submissionEvent: {
              type: 'NYLAS',
              configuration: {
                nylasGrantId: 'grant1',
                nylasConfigurationId: 'config1',
              },
            },
          },
          payment: null,
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).rejects.toThrow(
        'It looks like you are attempting to view a scheduling receipt for the incorrect booking.',
      )
    })

    it('should not add payment configuration if prevent payment is true', async () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        preventPayment: true,
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            submissionEvent: {
              type: 'NYLAS',
              configuration: {
                nylasGrantId: 'grant1',
                nylasConfigurationId: 'config1',
              },
            },
          },
          payment: {
            amount: 10,
            paymentFormUrl: 'FORM_URL',
            paymentReceiptUrl: 'RECEIPT_URL',
            hostedFormUrl: 'HOSTED_FORM_URL',
            submissionEvent: {
              type: 'WESTPAC_QUICK_STREAM',
              configuration: {
                elementId: 'ELEMENT_ID',
                environmentId: 'ENVIRONMENT_ID',
                customerReferenceNumber: 'crn',
              },
            },
          },
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        await getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).toEqual({
        submissionId: SUBMISSION_ID,
        submission: {
          calc: 10,
        },
        definition: formDefinition,
        preFillFormDataId: null,
        scheduling: {
          bookingUrl: 'BOOKING_URL',
          submissionEvent: {
            type: 'NYLAS',
            configuration: {
              nylasGrantId: 'grant1',
              nylasConfigurationId: 'config1',
            },
          },
        },
        payment: null,
        submissionTimestamp: '2025-01-17T03:09:25.559Z',
        isInPendingQueue: false,
        isOffline: false,
        isUploadingAttachments: false,
      })
    })

    it('should not add payment configuration if there is no paymentReceiptUrl', async () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: undefined,
        paymentFormUrl: 'FORM_URL',
        preventPayment: false,
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            submissionEvent: {
              type: 'NYLAS',
              configuration: {
                nylasGrantId: 'grant1',
                nylasConfigurationId: 'config1',
              },
            },
          },
          payment: {
            amount: 10,
            paymentFormUrl: 'FORM_URL',
            paymentReceiptUrl: 'RECEIPT_URL',
            hostedFormUrl: 'HOSTED_FORM_URL',
            submissionEvent: {
              type: 'WESTPAC_QUICK_STREAM',
              configuration: {
                elementId: 'ELEMENT_ID',
                environmentId: 'ENVIRONMENT_ID',
                customerReferenceNumber: 'crn',
              },
            },
          },
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        await getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).toEqual({
        submissionId: SUBMISSION_ID,
        submission: {
          calc: 10,
        },
        definition: formDefinition,
        preFillFormDataId: null,
        scheduling: {
          bookingUrl: 'BOOKING_URL',
          submissionEvent: {
            type: 'NYLAS',
            configuration: {
              nylasGrantId: 'grant1',
              nylasConfigurationId: 'config1',
            },
          },
        },
        payment: null,
        submissionTimestamp: '2025-01-17T03:09:25.559Z',
        isInPendingQueue: false,
        isOffline: false,
        isUploadingAttachments: false,
      })
    })

    it('should not add payment configuration if there is no payment event', async () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        preventPayment: false,
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: { ...formDefinition, paymentEvents: [] },
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            submissionEvent: {
              type: 'NYLAS',
              configuration: {
                nylasGrantId: 'grant1',
                nylasConfigurationId: 'config1',
              },
            },
          },
          payment: {
            amount: 10,
            paymentFormUrl: 'FORM_URL',
            paymentReceiptUrl: 'RECEIPT_URL',
            hostedFormUrl: 'HOSTED_FORM_URL',
            submissionEvent: {
              type: 'WESTPAC_QUICK_STREAM',
              configuration: {
                elementId: 'ELEMENT_ID',
                environmentId: 'ENVIRONMENT_ID',
                customerReferenceNumber: 'crn',
              },
            },
          },
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      expect(
        await getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).toEqual({
        submissionId: SUBMISSION_ID,
        submission: {
          calc: 10,
        },
        definition: { ...formDefinition, paymentEvents: [] },
        preFillFormDataId: null,
        scheduling: {
          bookingUrl: 'BOOKING_URL',
          submissionEvent: {
            type: 'NYLAS',
            configuration: {
              nylasGrantId: 'grant1',
              nylasConfigurationId: 'config1',
            },
          },
        },
        payment: null,
        submissionTimestamp: '2025-01-17T03:09:25.559Z',
        isInPendingQueue: false,
        isOffline: false,
        isUploadingAttachments: false,
      })
    })

    it('should add payment configuration if there a payment event and paymentReceiptUrl', async () => {
      vi.mocked(getSchedulingSubmissionResult).mockResolvedValue({
        paymentReceiptUrl: 'RECEIPT_URL',
        paymentFormUrl: 'FORM_URL',
        preventPayment: false,
        formSubmissionResult: {
          submissionId: SUBMISSION_ID,
          submission: {
            calc: 10,
          },
          definition: formDefinition,
          preFillFormDataId: null,
          scheduling: {
            bookingUrl: 'BOOKING_URL',
            submissionEvent: {
              type: 'NYLAS',
              configuration: {
                nylasGrantId: 'grant1',
                nylasConfigurationId: 'config1',
              },
            },
          },
          payment: null,
          submissionTimestamp: '2025-01-17T03:09:25.559Z',
          isInPendingQueue: false,
          isOffline: false,
          isUploadingAttachments: false,
        },
      })

      vi.mocked(handlePaymentSubmissionEvent).mockResolvedValue({
        amount: 10,
        paymentFormUrl: 'FORM_URL',
        paymentReceiptUrl: 'RECEIPT_URL',
        hostedFormUrl: 'HOSTED_FORM_URL',
        submissionEvent: {
          type: 'WESTPAC_QUICK_STREAM',
          configuration: {
            elementId: 'ELEMENT_ID',
            environmentId: 'ENVIRONMENT_ID',
            customerReferenceNumber: 'crn',
          },
        },
      })

      expect(
        await getSchedulingFormSubmissionResult(SUBMISSION_ID, {
          submissionId: SUBMISSION_ID,
          startTime: new Date(),
          endTime: new Date(),
          location: undefined,
          isReschedule: false,
        }),
      ).toEqual({
        submissionId: SUBMISSION_ID,
        submission: {
          calc: 10,
        },
        definition: formDefinition,
        preFillFormDataId: null,
        scheduling: {
          bookingUrl: 'BOOKING_URL',
          submissionEvent: {
            type: 'NYLAS',
            configuration: {
              nylasGrantId: 'grant1',
              nylasConfigurationId: 'config1',
            },
          },
        },
        payment: {
          amount: 10,
          paymentFormUrl: 'FORM_URL',
          paymentReceiptUrl: 'RECEIPT_URL',
          hostedFormUrl: 'HOSTED_FORM_URL',
          submissionEvent: {
            type: 'WESTPAC_QUICK_STREAM',
            configuration: {
              elementId: 'ELEMENT_ID',
              environmentId: 'ENVIRONMENT_ID',
              customerReferenceNumber: 'crn',
            },
          },
        },
        submissionTimestamp: '2025-01-17T03:09:25.559Z',
        isInPendingQueue: false,
        isOffline: false,
        isUploadingAttachments: false,
      })
    })
  })
})
