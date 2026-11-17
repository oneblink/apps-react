import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { FormTypes } from '@oneblink/types'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@react-input/mask', async () => {
  const React = await import('react')
  return {
    InputMask: (
      props: React.InputHTMLAttributes<HTMLInputElement> & {
        mask?: string
        replacement?: unknown
      },
    ) => {
      const inputProps = { ...props }
      delete inputProps.mask
      delete inputProps.replacement
      return React.createElement('input', inputProps)
    },
  }
})

import FormElementABN from '../../src/form-elements/FormElementABN'
import { IsOfflineContextProvider } from '../../src/hooks/useIsOffline'

const element: FormTypes.ABNElement = {
  id: 'abn-1',
  type: 'abn',
  name: 'abn',
  label: 'ABN',
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
}

const originalOnLine = Object.getOwnPropertyDescriptor(
  window.navigator,
  'onLine',
)

let unmount: (() => Promise<void>) | undefined

afterEach(async () => {
  if (unmount) {
    await unmount()
    unmount = undefined
  }
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  if (originalOnLine) {
    Object.defineProperty(window.navigator, 'onLine', originalOnLine)
  }
})

function setOnLine(onLine: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => onLine,
  })
}

async function render() {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(
      <IsOfflineContextProvider>
        <FormElementABN
          id="abn-1"
          element={element}
          readOnly={false}
          value={undefined}
          onChange={vi.fn()}
          displayValidationMessage={false}
          validationMessage={undefined}
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

async function enterAbn(container: HTMLElement, abn: string) {
  const input = container.querySelector('input')
  if (!input) {
    throw new Error('ABN input was not rendered')
  }
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  await React.act(async () => {
    setValue?.call(input, abn)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function validationMessage(container: HTMLElement) {
  return container.querySelector('.cypress-validation-message')?.textContent
}

describe('FormElementABN offline lookup', () => {
  test('shows an offline message instead of a failed-to-fetch error', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const container = await render()
    await goOffline()
    await enterAbn(container, '29114830723')

    expect(validationMessage(container)).toBe(
      'You are currently offline, please connect to the internet and try again',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('replaces a failed lookup with an offline message when connectivity drops', async () => {
    const fetchMock = vi.fn(async () => {
      setOnLine(false)
      throw new TypeError('Failed to fetch')
    })
    vi.stubGlobal('fetch', fetchMock)

    const container = await render()
    await enterAbn(container, '29114830723')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(validationMessage(container)).toBe(
      'You are currently offline, please connect to the internet and try again',
    )
    expect(validationMessage(container)).not.toMatch(/failed to fetch/i)
  })

  test('clears the offline message when the ABN is no longer complete', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const container = await render()
    await goOffline()
    await enterAbn(container, '29114830723')
    await enterAbn(container, '2911483072')

    expect(validationMessage(container)).toBeUndefined()
  })

  test('looks up the ABN again when connectivity returns', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('ABR is unavailable')
    })
    vi.stubGlobal('fetch', fetchMock)

    const container = await render()
    await goOffline()
    await enterAbn(container, '29114830723')
    expect(fetchMock).not.toHaveBeenCalled()

    setOnLine(true)
    await React.act(async () => {
      window.dispatchEvent(new Event('online'))
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(validationMessage(container)).toBe('ABR is unavailable')
  })
})
