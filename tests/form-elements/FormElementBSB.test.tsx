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

import { formService, OneBlinkAppsError } from '../../src/apps'
import { OFFLINE_ERROR_MESSAGE } from '../../src/apps/offline-service'
import FormElementBSB from '../../src/form-elements/FormElementBSB'
import { IsOfflineContextProvider } from '../../src/hooks/useIsOffline'

const element: FormTypes.BSBElement = {
  id: 'bsb-1',
  type: 'bsb',
  name: 'bsb',
  label: 'BSB',
  conditionallyShow: false,
  isDataLookup: false,
  isElementLookup: false,
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
  vi.restoreAllMocks()
  setOnLine(true)
})

function BsbHarness() {
  const [value, setValue] = React.useState<unknown>(undefined)
  const onChange = React.useCallback<
    React.ComponentProps<typeof FormElementBSB>['onChange']
  >((_element, change) => {
    setValue(change.value)
  }, [])
  return (
    <FormElementBSB
      id="bsb-1"
      formId={1}
      element={element}
      readOnly={false}
      value={value}
      onChange={onChange}
      displayValidationMessage={false}
      validationMessage={undefined}
      isDirty={false}
      setIsDirty={vi.fn()}
    />
  )
}

async function render() {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(
      <IsOfflineContextProvider>
        <BsbHarness />
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

async function enterBsb(container: HTMLElement, bsb: string) {
  const input = container.querySelector('input')
  if (!input) {
    throw new Error('BSB input was not rendered')
  }
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  await React.act(async () => {
    setValue?.call(input, bsb)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function validationMessage(container: HTMLElement) {
  return container.querySelector('.cypress-validation-message')?.textContent
}

describe('FormElementBSB offline lookup', () => {
  test('shows an offline message instead of saying the BSB does not exist', async () => {
    const getBSBRecord = vi.spyOn(formService, 'getBSBRecord')

    const container = await render()
    await goOffline()
    await enterBsb(container, '123-456')

    expect(validationMessage(container)).toBe(OFFLINE_ERROR_MESSAGE)
    expect(getBSBRecord).not.toHaveBeenCalled()
  })

  test('shows an offline message when the lookup fails because the device is offline', async () => {
    vi.spyOn(formService, 'getBSBRecord').mockRejectedValue(
      new OneBlinkAppsError(OFFLINE_ERROR_MESSAGE, { isOffline: true }),
    )

    const container = await render()
    await enterBsb(container, '123-456')

    expect(validationMessage(container)).toBe(OFFLINE_ERROR_MESSAGE)
    expect(validationMessage(container)).not.toContain('does not exist')
  })

  test('keeps a validated BSB when connectivity drops', async () => {
    vi.spyOn(formService, 'getBSBRecord').mockResolvedValue({
      bsb: '123-456',
      financialInstitutionMnemonic: 'CBA',
      name: 'Commonwealth Bank',
      street: '1 Bank St',
      suburb: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    })

    const container = await render()
    await enterBsb(container, '123-456')

    expect(container.textContent).toContain('CBA - Commonwealth Bank')

    await goOffline()

    expect(container.textContent).toContain('CBA - Commonwealth Bank')
    expect(validationMessage(container)).toBeUndefined()
  })
})
