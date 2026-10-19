import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import useFormSubmissionAutoSaveState from '../../src/hooks/useFormSubmissionAutoSaveState'

const { getAutoSaveData } = vi.hoisted(() => ({
  getAutoSaveData: vi.fn(),
}))

vi.mock('../../src/apps', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/apps')>()
  return {
    ...original,
    autoSaveService: {
      ...original.autoSaveService,
      getAutoSaveData,
      upsertAutoSaveData: vi.fn().mockResolvedValue(undefined),
      deleteAutoSaveData: vi.fn().mockResolvedValue(undefined),
    },
  }
})

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const AUTO_SAVE_KEY = 'auto-save-key'

const pointAddressV3Element: FormTypes.PointAddressV3Element = {
  id: '6b3f1c8e-4f3a-4b7e-9c55-0d6f1a2b3c4d',
  name: 'address',
  label: 'Address',
  type: 'pointAddressV3',
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const textElement: FormTypes.TextElement = {
  id: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  name: 'name',
  label: 'Name',
  type: 'text',
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const numberElement: FormTypes.NumberElement = {
  id: '1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e',
  name: 'age',
  label: 'Age',
  type: 'number',
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
  isSlider: false,
}

const sectionElement: FormTypes.SectionElement = {
  id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
  label: 'Section',
  type: 'section',
  isCollapsed: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  elements: [numberElement],
}

const filesElement: FormTypes.FilesElement = {
  id: '3d4e5f6a-7b8c-4d9e-8f0a-1b2c3d4e5f6a',
  name: 'files',
  label: 'Files',
  type: 'files',
  storageType: 'private',
  readOnly: false,
  restrictFileTypes: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const dateElement: FormTypes.DateElement = {
  id: '4e5f6a7b-8c9d-4e0f-9a1b-2c3d4e5f6a7b',
  name: 'date',
  label: 'Date',
  type: 'date',
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const datetimeElement: FormTypes.DateTimeElement = {
  id: '5f6a7b8c-9d0e-4f1a-8b2c-3d4e5f6a7b8c',
  name: 'datetime',
  label: 'Date Time',
  type: 'datetime',
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const booleanElement: FormTypes.BooleanElement = {
  id: '6a7b8c9d-0e1f-4a2b-9c3d-4e5f6a7b8c9d',
  name: 'agree',
  label: 'Agree',
  type: 'boolean',
  defaultValue: false,
  required: false,
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  isDataLookup: false,
  isElementLookup: false,
}

const repeatableSetElement: FormTypes.RepeatableSetElement = {
  id: '7b8c9d0e-1f2a-4b3c-8d4e-5f6a7b8c9d0e',
  name: 'people',
  label: 'People',
  type: 'repeatableSet',
  readOnly: false,
  conditionallyShow: false,
  requiresAllConditionallyShowPredicates: false,
  elements: [
    {
      ...textElement,
      id: '8c9d0e1f-2a3b-4c4d-9e5f-6a7b8c9d0e1f',
      name: 'personName',
    },
  ],
}

const form: FormTypes.Form = {
  id: 1,
  name: 'Form',
  description: '',
  organisationId: 'organisationId',
  formsAppEnvironmentId: 1,
  formsAppIds: [],
  elements: [
    pointAddressV3Element,
    textElement,
    sectionElement,
    filesElement,
    dateElement,
    datetimeElement,
    booleanElement,
    repeatableSetElement,
  ],
  isAuthenticated: false,
  isMultiPage: false,
  postSubmissionAction: 'FORMS_LIBRARY',
  cancelAction: 'FORMS_LIBRARY',
  submissionEvents: [],
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const validPointAddressV3 = {
  type: 'Feature',
  properties: {
    addressId: 'GANSW123',
    formattedAddress: '1 Example St, SYDNEY NSW 2000',
  },
}

const validFiles = [
  {
    s3: {
      region: 'ap-southeast-2',
      bucket: 'customer.forms.oneblink.io',
      key: 'submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
    },
    url: 'https://auth-api.blinkm.io/submissions/1/attachments/44cdee6f-edbd-4620-aaf5-df25ce976e43',
    contentType: 'image/png',
    fileName: 'dot.png',
    id: '44cdee6f-edbd-4620-aaf5-df25ce976e43',
    isPrivate: true,
  },
  {
    _id: '55cdee6f-edbd-4620-aaf5-df25ce976e43',
    type: 'image/png',
    fileName: 'not-uploaded.png',
    isPrivate: true,
  },
]

// Values for every element in the form, so no defaults are applied
const emptySubmission = {
  address: undefined,
  name: undefined,
  age: undefined,
  files: undefined,
  date: undefined,
  datetime: undefined,
  agree: false,
  people: undefined,
}

type AutoSaveState = ReturnType<typeof useFormSubmissionAutoSaveState>

function Host({
  form,
  stateRef,
}: {
  form: FormTypes.Form
  stateRef: React.RefObject<AutoSaveState | null>
}) {
  const state = useFormSubmissionAutoSaveState({
    form,
    autoSaveKey: AUTO_SAVE_KEY,
    onCancel: () => {},
    onSubmit: () => {},
  })
  React.useEffect(() => {
    stateRef.current = state
  }, [state, stateRef])
  return null
}

async function resumeAutoSave(
  autoSaveSubmission: SubmissionTypes.S3SubmissionData['submission'],
  formDefinition: FormTypes.Form = form,
) {
  getAutoSaveData.mockImplementation(async (formId: number, key: string) =>
    key === AUTO_SAVE_KEY ? autoSaveSubmission : null,
  )

  const stateRef = React.createRef<AutoSaveState>()
  const root = createRoot(
    document.body.appendChild(document.createElement('div')),
  )
  await React.act(async () => {
    root.render(<Host form={formDefinition} stateRef={stateRef} />)
  })

  if (!formDefinition.continueWithAutosave) {
    expect(stateRef.current?.isAutoSaveSubmissionAvailable).toBe(true)
    await React.act(async () => {
      stateRef.current?.continueAutoSaveSubmission()
    })
  }
  const submission = stateRef.current?.submission

  await React.act(async () => root.unmount())
  return submission
}

beforeEach(() => {
  vi.stubEnv('TZ', 'UTC')
  getAutoSaveData.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  document.body.replaceChildren()
})

describe('useFormSubmissionAutoSaveState()', () => {
  test('drops V2 point address data on a "pointAddressV3" element when resuming', async () => {
    const submission = await resumeAutoSave({
      ...emptySubmission,
      address: {
        addressId: 'GANSW123',
        addressRecordType: 'Primary',
      },
      name: 'Blinky Bill',
    })

    expect(submission).toStrictEqual({
      ...emptySubmission,
      address: undefined,
      name: 'Blinky Bill',
    })
  })

  test('drops data that is invalid for the current element type when resuming', async () => {
    const submission = await resumeAutoSave({
      address: 'not an address',
      name: 123,
      age: 'not a number',
      files: [{}],
      date: 'not a date',
      datetime: 'not a date',
      agree: 'yes',
      people: 'not entries',
    })

    expect(submission).toStrictEqual(emptySubmission)
  })

  test('resumes valid auto save data unchanged', async () => {
    const autoSaveSubmission = {
      address: validPointAddressV3,
      name: 'Blinky Bill',
      age: 42,
      files: validFiles,
      date: '2020-02-02',
      datetime: '2020-02-02T12:00:00.000Z',
      agree: true,
      people: [
        {
          $__id: 'entry-1',
          personName: 'Nutsy',
        },
      ],
    }

    const submission = await resumeAutoSave(structuredClone(autoSaveSubmission))

    expect(submission).toStrictEqual(autoSaveSubmission)
  })

  test('applies defaults for elements missing from the auto save data', async () => {
    const submission = await resumeAutoSave(
      {
        ...emptySubmission,
        address: undefined,
      },
      {
        ...form,
        elements: [
          ...form.elements,
          {
            ...textElement,
            id: '9d0e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f2a',
            name: 'addedAfterAutoSave',
            defaultValue: 'default',
          },
        ],
      },
    )

    expect(submission).toStrictEqual({
      ...emptySubmission,
      addedAfterAutoSave: 'default',
    })
  })

  test('does not apply defaults to elements cleared before auto saving', async () => {
    const submission = await resumeAutoSave(
      {
        ...emptySubmission,
        name: undefined,
      },
      {
        ...form,
        elements: form.elements.map((element) =>
          element.id === textElement.id
            ? { ...textElement, defaultValue: 'default' }
            : element,
        ),
      },
    )

    expect(submission).toStrictEqual(emptySubmission)
  })

  test('parses auto save data when the form continues with auto save automatically', async () => {
    const submission = await resumeAutoSave(
      {
        ...emptySubmission,
        address: {
          addressId: 'GANSW123',
          addressRecordType: 'Primary',
        },
      },
      {
        ...form,
        continueWithAutosave: true,
      },
    )

    expect(submission).toStrictEqual(emptySubmission)
  })
})
