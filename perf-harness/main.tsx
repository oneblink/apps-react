import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { FormTypes } from '@oneblink/types'
import { OneBlinkFormUncontrolled } from '../src/OneBlinkForm'
import OneBlinkAutoSaveForm from '../src/OneBlinkAutoSaveForm'
import rawForm from '../food-sampling-benchmark-form.json'
import '../dist/styles.css'

const params = new URLSearchParams(location.search)
const SAMPLE_ENTRIES = Number(params.get('entries') || 0)
const SAMPLE_SETS = Number(params.get('sets') || 1)

const originalFetch = window.fetch
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.toString()
  if (url.startsWith(location.origin) || url.startsWith('/')) {
    return originalFetch(input, init)
  }
  return new Response(
    JSON.stringify({
      formElementLookups: [],
      formElementDynamicOptionSets: [],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

const seededSetNames = new Set(
  Array.from({ length: SAMPLE_SETS }, (_, i) => `sampleDetails${i + 1}`),
)
function raiseSeededSetMaximums(
  elements: FormTypes.FormElement[],
): FormTypes.FormElement[] {
  return elements.map((element) => {
    if (
      element.type === 'repeatableSet' &&
      seededSetNames.has(element.name) &&
      typeof element.maxSetEntries === 'number' &&
      element.maxSetEntries < SAMPLE_ENTRIES
    ) {
      return { ...element, maxSetEntries: SAMPLE_ENTRIES }
    }
    if ('elements' in element && element.type !== 'form' && element.elements) {
      return {
        ...element,
        elements: raiseSeededSetMaximums(element.elements),
      } as FormTypes.FormElement
    }
    return element
  })
}

const ALL_PAGES = params.get('allPages') !== 'false'
const AUTO_SAVE = params.get('autoSave') === 'true'

const baseForm = rawForm as unknown as FormTypes.Form
const form: FormTypes.Form = {
  ...baseForm,
  elements: raiseSeededSetMaximums(
    baseForm.elements.map((element) =>
      ALL_PAGES && element.type === 'page'
        ? {
            ...element,
            conditionallyShow: false,
            conditionallyShowPredicates: undefined,
          }
        : element,
    ),
  ),
}

const initialSubmission = Object.fromEntries(
  Array.from({ length: SAMPLE_SETS }, (_, setIndex) => [
    `sampleDetails${setIndex + 1}`,
    Array.from({ length: SAMPLE_ENTRIES }, (_, entryIndex) => ({
      typesOfSamples: 'Feed',
      sampleNumber: `S-${setIndex}-${entryIndex}`,
      sampleDescription: `Sample ${setIndex}-${entryIndex} description`,
      sampleOfficerName: 'Alan Edwards',
      showAll: false,
      officialSampleSeal: 'Yes',
      brand: 'Brand',
      quantity: 2,
      bestBefore: '2026-12-01',
      useBy: '2026-12-01',
      batchCode: `B${entryIndex}`,
      price: 4.5,
      amountTendered: 5,
      remarks: 'Remarks',
      testingDetails: [{ testCode: `T${entryIndex}` }],
    })),
  ]).filter(() => SAMPLE_ENTRIES > 0),
)

declare global {
  interface Window {
    __perf: {
      renderStart: number
      firstCommit?: number
      longTasks: { start: number; duration: number }[]
    }
  }
}
window.__perf = { renderStart: performance.now(), longTasks: [] }
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    window.__perf.longTasks.push({
      start: Math.round(entry.startTime),
      duration: Math.round(entry.duration),
    })
  }
}).observe({ type: 'longtask', buffered: true })

function FirstCommit() {
  React.useEffect(() => {
    window.__perf.firstCommit = performance.now()
  }, [])
  return null
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <MemoryRouter>
    <FirstCommit />
    {AUTO_SAVE ? (
      <OneBlinkAutoSaveForm
        form={form}
        initialSubmission={initialSubmission}
        autoSaveKey={`perf-${location.search}-${Date.now()}`}
        audience="SUBMITTER"
        isPendingQueueEnabled={false}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    ) : (
      <OneBlinkFormUncontrolled
        form={form}
        initialSubmission={initialSubmission}
        audience="SUBMITTER"
        isPendingQueueEnabled={false}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    )}
  </MemoryRouter>,
)
