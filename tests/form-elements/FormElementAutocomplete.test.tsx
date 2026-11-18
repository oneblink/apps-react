import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { FormTypes } from '@oneblink/types'
import { afterEach, describe, expect, test, vi } from 'vitest'

import FormElementAutocomplete from '../../src/form-elements/FormElementAutocomplete'
import { IsOfflineContextProvider } from '../../src/hooks/useIsOffline'
import { OFFLINE_ERROR_MESSAGE } from '../../src/apps/offline-service'

const element: FormTypes.AutoCompleteElement = {
  id: 'autocomplete-1',
  type: 'autocomplete',
  name: 'autocomplete',
  label: 'Search',
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
  optionsType: 'SEARCH',
  searchUrl: 'https://example.test/search',
}

let unmount: (() => Promise<void>) | undefined

function setOnLine(onLine: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => onLine,
  })
}

afterEach(async () => {
  if (unmount) {
    await unmount()
    unmount = undefined
  }
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  setOnLine(true)
})

async function render() {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(
      <IsOfflineContextProvider>
        <FormElementAutocomplete
          id="autocomplete-1"
          element={element}
          readOnly={false}
          value={undefined}
          onChange={vi.fn()}
          displayValidationMessage={false}
          validationMessage={undefined}
          onUpdateFormElements={vi.fn()}
          isDirty={false}
          setIsDirty={vi.fn()}
        />
      </IsOfflineContextProvider>,
    )
  })
  unmount = () => React.act(async () => root.unmount())
  return container
}

async function goOffline() {
  setOnLine(false)
  await React.act(async () => {
    window.dispatchEvent(new Event('offline'))
  })
}

async function search(container: HTMLElement, text: string) {
  const input = container.querySelector('input')
  if (!input) {
    throw new Error('Autocomplete input was not rendered')
  }
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  await React.act(async () => {
    setValue?.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 800))
  })
}

function searchError(container: HTMLElement) {
  return container.querySelector('.cypress-autocomplete-error')?.textContent
}

describe('FormElementAutocomplete offline search', () => {
  test('shows search results served from the cache while offline', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([{ label: 'Abbey Road', value: 'abbey' }])),
    )
    vi.stubGlobal('fetch', fetchMock)

    const container = await render()
    await goOffline()
    await search(container, 'ab')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(searchError(container)).toBeUndefined()
    expect(container.textContent).toContain('Abbey Road')
  })

  test('shows an offline message when an offline search is not cached', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetchMock)

    const container = await render()
    await goOffline()
    await search(container, 'ab')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(searchError(container)).toBe(OFFLINE_ERROR_MESSAGE)
  })

  test('replaces a failed search with an offline message when connectivity drops', async () => {
    const fetchMock = vi.fn(async () => {
      setOnLine(false)
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetchMock)

    setOnLine(true)
    const container = await render()
    await search(container, 'ab')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(searchError(container)).toBe(OFFLINE_ERROR_MESSAGE)
  })
})
