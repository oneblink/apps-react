import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import { OneBlinkFormUncontrolled } from '../../src/OneBlinkForm'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

HTMLElement.prototype.scrollIntoView = () => {}

globalThis.fetch = async () =>
  new Response(
    JSON.stringify({
      formElementLookups: [],
      formElementDynamicOptionSets: [],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )

// jsdom scans the whole document for other radios in the group each time a
// checked radio is inserted or updated, which browsers do not. On large forms
// that scan dominates the timings, so it is disabled.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jsdom/lib/jsdom/living/nodes/HTMLInputElement-impl.js').implementation.prototype._removeOtherRadioCheckedness =
  () => {}

// The form logs its container element on every mount, which floods the output.
const consoleLog = console.log
console.log = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('Setting toast notifications')
  ) {
    return
  }
  consoleLog(...args)
}

function option(id: string, value: string): FormTypes.ChoiceElementOption {
  return { id, label: value, value }
}

function sampleEntryElements(prefix: string): FormTypes.FormElement[] {
  return [
    {
      id: `${prefix}-heading`,
      name: 'sampleHeading',
      label: 'Sample',
      type: 'html',
      defaultValue: '<p>Sample {ELEMENT:sampleNumber}</p>',
      conditionallyShow: false,
    },
    {
      id: `${prefix}-type`,
      name: 'sampleType',
      label: 'Type of sample',
      type: 'select',
      required: true,
      readOnly: false,
      conditionallyShow: false,
      optionsType: 'CUSTOM',
      options: [
        option(`${prefix}-type-feed`, 'Feed'),
        option(`${prefix}-type-swab`, 'Swab'),
        option(`${prefix}-type-water`, 'Water'),
        option(`${prefix}-type-other`, 'Other'),
      ],
    },
    {
      id: `${prefix}-other-type`,
      name: 'otherSampleType',
      label: 'Other type of sample',
      type: 'text',
      required: true,
      readOnly: false,
      conditionallyShow: true,
      requiresAllConditionallyShowPredicates: false,
      conditionallyShowPredicates: [
        {
          type: 'OPTIONS',
          elementId: `${prefix}-type`,
          optionIds: [`${prefix}-type-other`],
        },
      ],
    },
    {
      id: `${prefix}-number`,
      name: 'sampleNumber',
      label: 'Sample number',
      type: 'text',
      required: true,
      readOnly: false,
      conditionallyShow: false,
    },
    {
      id: `${prefix}-description`,
      name: 'sampleDescription',
      label: 'Sample description',
      type: 'textarea',
      required: true,
      readOnly: false,
      conditionallyShow: false,
    },
    {
      id: `${prefix}-seal`,
      name: 'officialSampleSeal',
      label: 'Official sample seal',
      type: 'radio',
      required: true,
      readOnly: false,
      conditionallyShow: false,
      buttons: false,
      optionsType: 'CUSTOM',
      options: [
        option(`${prefix}-seal-yes`, 'Yes'),
        option(`${prefix}-seal-no`, 'No'),
      ],
    },
    ...(
      [
        ['brand', 'Brand', 'text'],
        ['batchCode', 'Batch code', 'text'],
        ['quantity', 'Quantity', 'number'],
        ['price', 'Price', 'number'],
        ['remarks', 'Remarks', 'textarea'],
      ] as const
    ).map(
      ([name, label, type]) =>
        ({
          id: `${prefix}-${name}`,
          name,
          label,
          type,
          required: false,
          readOnly: false,
          isSlider: false,
          conditionallyShow: true,
          requiresAllConditionallyShowPredicates: false,
          conditionallyShowPredicates: [
            {
              type: 'OPTIONS',
              elementId: `${prefix}-seal`,
              optionIds: [`${prefix}-seal-yes`],
            },
          ],
        }) as FormTypes.FormElement,
    ),
    {
      id: `${prefix}-total`,
      name: 'total',
      label: 'Total',
      type: 'calculation',
      conditionallyShow: false,
      calculation: 'ISNULL({ELEMENT:quantity},0) * ISNULL({ELEMENT:price},0)',
      defaultValue: '<p>{RESULT}</p>',
    },
    {
      id: `${prefix}-tests`,
      name: 'testingDetails',
      label: 'Testing details',
      type: 'repeatableSet',
      readOnly: false,
      conditionallyShow: false,
      minSetEntries: 1,
      elements: [
        {
          id: `${prefix}-test-code`,
          name: 'testCode',
          label: 'Test code',
          type: 'text',
          required: false,
          readOnly: false,
          conditionallyShow: false,
        },
      ],
    },
  ] as FormTypes.FormElement[]
}

function samplesRepeatableSet(
  index: number,
  maxSetEntries: number,
): FormTypes.RepeatableSetElement {
  return {
    id: `samples-${index}`,
    name: `samples${index}`,
    label: 'Samples',
    type: 'repeatableSet',
    readOnly: false,
    conditionallyShow: false,
    minSetEntries: 1,
    maxSetEntries,
    elements: sampleEntryElements(`samples-${index}`),
  }
}

export type LargeFormLayout = {
  /** The number of repeatable sets, each on its own page */
  sets: number
  /** The number of entries in each repeatable set */
  entriesPerSet: number
}

/**
 * A multi-page form shaped like a sampling form: a details page, one page per
 * repeatable set of samples, and a summary page that injects element values.
 */
export function generateLargeForm({
  sets,
  entriesPerSet,
}: LargeFormLayout): FormTypes.Form {
  const pages: FormTypes.PageElement[] = [
    {
      id: 'page-details',
      type: 'page',
      label: 'Details',
      conditionallyShow: false,
      elements: [
        {
          id: 'sample-date',
          name: 'sampleDate',
          label: 'Date of sampling',
          type: 'date',
          required: true,
          readOnly: false,
          conditionallyShow: false,
          defaultValue: 'NOW',
        },
        {
          id: 'officer-mobile',
          name: 'officerMobile',
          label: 'Officer mobile',
          type: 'text',
          required: true,
          readOnly: false,
          conditionallyShow: false,
        },
        {
          id: 'business-type',
          name: 'businessType',
          label: 'Type of business',
          type: 'select',
          required: true,
          readOnly: false,
          conditionallyShow: false,
          optionsType: 'CUSTOM',
          options: [
            option('business-type-retailer', 'Retailer'),
            option('business-type-manufacturer', 'Manufacturer'),
            option('business-type-farm', 'Farm'),
          ],
        },
        {
          id: 'notes',
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          required: false,
          readOnly: false,
          conditionallyShow: false,
        },
      ] as FormTypes.FormElement[],
    },
    ...Array.from(
      { length: sets },
      (_, index): FormTypes.PageElement => ({
        id: `page-samples-${index + 1}`,
        type: 'page',
        label: `Samples ${index + 1}`,
        conditionallyShow: false,
        elements: [samplesRepeatableSet(index + 1, entriesPerSet)],
      }),
    ),
    {
      id: 'page-summary',
      type: 'page',
      label: 'Summary',
      conditionallyShow: false,
      elements: [
        {
          id: 'summary',
          name: 'summary',
          label: 'Summary',
          type: 'html',
          defaultValue:
            '<p>Officer {ELEMENT:officerMobile} sampled a {ELEMENT:businessType} on {ELEMENT:sampleDate}</p>',
          conditionallyShow: false,
        },
      ] as FormTypes.FormElement[],
    },
  ]

  const form: FormTypes.Form = {
    id: 1,
    name: 'Large form',
    description: '',
    formsAppEnvironmentId: 1,
    formsAppIds: [],
    organisationId: 'organisationId',
    isAuthenticated: false,
    isMultiPage: true,
    isArchived: false,
    postSubmissionAction: 'FORMS_LIBRARY',
    cancelAction: 'BACK',
    submissionEvents: [],
    tags: [],
    elements: pages,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
  return form
}

export function generateLargeFormSubmission({
  sets,
  entriesPerSet,
}: LargeFormLayout): SubmissionTypes.S3SubmissionData['submission'] {
  return Object.fromEntries(
    Array.from({ length: sets }, (_, setIndex) => [
      `samples${setIndex + 1}`,
      Array.from({ length: entriesPerSet }, (_, entryIndex) => ({
        sampleType: 'Feed',
        sampleNumber: `S-${setIndex}-${entryIndex}`,
        sampleDescription: `Sample ${setIndex}-${entryIndex} description`,
        officialSampleSeal: 'Yes',
        brand: 'Brand',
        batchCode: `B${entryIndex}`,
        quantity: 2,
        price: 4.5,
        remarks: 'Remarks',
        testingDetails: [{ testCode: `T${entryIndex}` }],
      })),
    ]),
  )
}

export type MountedLargeForm = {
  container: HTMLElement
  root: Root
  form: FormTypes.Form
}

export async function mountLargeForm(
  layout: LargeFormLayout,
): Promise<MountedLargeForm> {
  const form = generateLargeForm(layout)
  const initialSubmission = generateLargeFormSubmission(layout)
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(
      <MemoryRouter>
        <OneBlinkFormUncontrolled
          form={form}
          initialSubmission={initialSubmission}
          audience="SUBMITTER"
          isPendingQueueEnabled={false}
          onCancel={() => {}}
          onSubmit={() => {}}
        />
      </MemoryRouter>,
    )
  })
  return { container, root, form }
}

export async function unmountLargeForm({ container, root }: MountedLargeForm) {
  await React.act(async () => root.unmount())
  container.remove()
}

export async function typeInto(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(
      element,
      value,
    )
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export async function navigateToPage(
  { container }: MountedLargeForm,
  pageId: string,
) {
  const button = container.querySelector<HTMLElement>(
    `[id="steps-navigation-step-${pageId}"]`,
  )
  if (!button) {
    throw new Error(`Could not find the step button for page "${pageId}"`)
  }
  await React.act(async () => button.click())
}
