import { FormTypes } from '@oneblink/types'
import { expect, it, describe } from 'vitest'
import getVersionedFormTableState, {
  FormTableState,
  latestStateVersion,
} from '../../../src/components/formStore/table/getVersionedState'

const createForm = ({
  hasSchedulingEvents = false,
  hasPaymentEvents = false,
}: {
  hasSchedulingEvents?: boolean
  hasPaymentEvents?: boolean
} = {}) =>
  ({
    id: 1,
    schedulingEvents: hasSchedulingEvents ? [{}] : [],
    paymentEvents: hasPaymentEvents ? [{}] : [],
  }) as FormTypes.Form

const formWithEvents = createForm({
  hasSchedulingEvents: true,
  hasPaymentEvents: true,
})

const formWithoutEvents = createForm()

const calendarEventHiddenColumnVisibility = {
  CALENDAR_EVENT_TITLE: false,
  CALENDAR_EVENT_CALENDAR_NAME: false,
  CALENDAR_EVENT_DATE_TIME: false,
  CALENDAR_EVENT_CANCELLED_REASON: false,
}

const paymentHiddenColumnVisibility = {
  PAYMENT_STATUS: false,
  PAYMENT_PROVIDER_TRANSACTION_ID: false,
  PAYMENT_PROVIDER_RECEIPT_NUMBER: false,
}

describe('getVersionedFormTableState', () => {
  it('should return the same state if defaultHiddenColumnsVersion is the latest', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['FORM_COLUMN'],
      defaultHiddenColumnsVersion: latestStateVersion,
    }
    const updatedState = getVersionedFormTableState({
      form: formWithoutEvents,
      initialState,
    })
    expect(updatedState).toEqual({
      ...initialState,
      columnVisibility: { FORM_COLUMN: false },
    })
  })

  it('should update state to latest version if hiddenColumns is undefined by adding all hidden columns', () => {
    const initialState: FormTableState = {
      formId: 1,
    }
    const updatedState = getVersionedFormTableState({
      form: formWithEvents,
      initialState,
    })
    expect(updatedState).toEqual({
      ...initialState,
      columnVisibility: {
        SUBMISSION_ID: false,
        EXTERNAL_ID: false,
        TASK: false,
        TASK_ACTION: false,
        TASK_GROUP: false,
        TASK_GROUP_INSTANCE: false,
        COMPLETED_AT: false,
      },
      defaultHiddenColumnsVersion: latestStateVersion,
    })
  })

  it('should update state to latest version if defaultHiddenColumnsVersion is undefined but not add in anything from initial version if hidden columns has been defined', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['EXTERNAL_ID'],
    }
    const updatedState = getVersionedFormTableState({
      form: formWithEvents,
      initialState,
    })
    expect(updatedState).toEqual({
      ...initialState,
      hiddenColumns: ['EXTERNAL_ID'],
      defaultHiddenColumnsVersion: latestStateVersion,
      columnVisibility: {
        EXTERNAL_ID: false,
        TASK: false,
        TASK_ACTION: false,
        TASK_GROUP: false,
        TASK_GROUP_INSTANCE: false,
        COMPLETED_AT: false,
      },
    })
  })

  it('should add default hidden columns from V2 but not change columns from V1 if defaultHiddenColumnsVersion is V1', () => {
    const initialState: FormTableState = {
      formId: 1,
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'FORM_COLUMN'],
      defaultHiddenColumnsVersion: 'V1',
    }
    const updatedState = getVersionedFormTableState({
      form: formWithEvents,
      initialState,
    })
    expect(updatedState).toEqual({
      ...initialState,
      hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'FORM_COLUMN'],
      defaultHiddenColumnsVersion: latestStateVersion,
      columnVisibility: {
        SUBMISSION_ID: false,
        EXTERNAL_ID: false,
        TASK: false,
        FORM_COLUMN: false,
        COMPLETED_AT: false,
      },
    })
  })

  describe('V3 dynamic hidden columns', () => {
    it('should hide calendar and payment columns for a brand new state when the form does not have those events', () => {
      const initialState: FormTableState = {
        formId: 1,
      }
      const updatedState = getVersionedFormTableState({
        form: formWithoutEvents,
        initialState,
      })
      expect(updatedState).toEqual({
        ...initialState,
        columnVisibility: {
          SUBMISSION_ID: false,
          EXTERNAL_ID: false,
          TASK: false,
          TASK_ACTION: false,
          TASK_GROUP: false,
          TASK_GROUP_INSTANCE: false,
          COMPLETED_AT: false,
          ...calendarEventHiddenColumnVisibility,
          ...paymentHiddenColumnVisibility,
        },
        defaultHiddenColumnsVersion: latestStateVersion,
      })
    })

    it('should only hide the dynamic columns that the form does not support for a brand new state', () => {
      const initialState: FormTableState = {
        formId: 1,
      }
      const updatedState = getVersionedFormTableState({
        form: createForm({
          hasSchedulingEvents: true,
          hasPaymentEvents: false,
        }),
        initialState,
      })
      expect(updatedState).toEqual({
        ...initialState,
        columnVisibility: {
          SUBMISSION_ID: false,
          EXTERNAL_ID: false,
          TASK: false,
          TASK_ACTION: false,
          TASK_GROUP: false,
          TASK_GROUP_INSTANCE: false,
          COMPLETED_AT: false,
          ...paymentHiddenColumnVisibility,
        },
        defaultHiddenColumnsVersion: latestStateVersion,
      })
    })

    it('should add dynamic hidden columns when upgrading from V2 if the form does not have those events', () => {
      const initialState: FormTableState = {
        formId: 1,
        hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'COMPLETED_AT'],
        defaultHiddenColumnsVersion: 'V2',
      }
      const updatedState = getVersionedFormTableState({
        form: formWithoutEvents,
        initialState,
      })
      expect(updatedState).toEqual({
        ...initialState,
        hiddenColumns: ['SUBMISSION_ID', 'EXTERNAL_ID', 'TASK', 'COMPLETED_AT'],
        defaultHiddenColumnsVersion: latestStateVersion,
        columnVisibility: {
          SUBMISSION_ID: false,
          EXTERNAL_ID: false,
          TASK: false,
          COMPLETED_AT: false,
          ...calendarEventHiddenColumnVisibility,
          ...paymentHiddenColumnVisibility,
        },
      })
    })

    it('should only hide the dynamic columns that the form does not support when upgrading from V2', () => {
      const initialState: FormTableState = {
        formId: 1,
        hiddenColumns: ['SUBMISSION_ID'],
        defaultHiddenColumnsVersion: 'V2',
      }
      const updatedState = getVersionedFormTableState({
        form: createForm({
          hasSchedulingEvents: true,
          hasPaymentEvents: false,
        }),
        initialState,
      })
      expect(updatedState).toEqual({
        ...initialState,
        hiddenColumns: ['SUBMISSION_ID'],
        defaultHiddenColumnsVersion: latestStateVersion,
        columnVisibility: {
          SUBMISSION_ID: false,
          ...paymentHiddenColumnVisibility,
        },
      })
    })

    it('should not re-apply dynamic hidden columns if the state is already on V3', () => {
      const initialState: FormTableState = {
        formId: 1,
        hiddenColumns: ['FORM_COLUMN'],
        defaultHiddenColumnsVersion: 'V3',
      }
      const updatedState = getVersionedFormTableState({
        form: formWithoutEvents,
        initialState,
      })
      expect(updatedState).toEqual({
        ...initialState,
        columnVisibility: { FORM_COLUMN: false },
      })
    })
  })
})
