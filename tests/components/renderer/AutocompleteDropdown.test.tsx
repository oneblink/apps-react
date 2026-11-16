import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../src/apps', () => ({
  Sentry: {
    captureException: vi.fn(),
  },
}))

import AutocompleteDropdown from '../../../src/components/renderer/AutocompleteDropdown'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const options = [
  { label: '1 Test Street', value: 'address-1' },
  { label: '2 Test Street', value: 'address-2' },
]

function AddressAutocomplete({
  onChangeValue,
}: {
  onChangeValue: (value: string | undefined) => void
}) {
  const [label, setLabel] = React.useState('')
  const [value, setValue] = React.useState<{ id: string } | undefined>()

  return (
    <AutocompleteDropdown
      id="address"
      label={label}
      value={value}
      placeholder="Search"
      required={false}
      disabled={false}
      validationMessage={undefined}
      displayValidationMessage={false}
      searchDebounceMs={0}
      searchMinCharacters={1}
      onChangeLabel={setLabel}
      onChangeValue={(newValue) => {
        onChangeValue(newValue)
        // Address elements replace the option id with the resolved record.
        setValue(newValue === undefined ? undefined : { id: newValue })
      }}
      onSearch={async () => options}
      isDirty={false}
      setIsDirty={() => {}}
    />
  )
}

afterEach(() => {
  document.body.replaceChildren()
})

async function renderAddressAutocomplete(
  onChangeValue: (value: string | undefined) => void,
) {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  await React.act(async () => {
    root.render(<AddressAutocomplete onChangeValue={onChangeValue} />)
  })
  return {
    container,
    unmount: () => {
      root.unmount()
    },
  }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function search(input: HTMLInputElement, text: string) {
  await React.act(async () => {
    setInputValue(input, text)
  })
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

function blurInput(input: HTMLInputElement) {
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
}

describe('AutocompleteDropdown', () => {
  test('mouse selection followed by blur looks up the address once', async () => {
    const onChangeValue = vi.fn()
    const { container, unmount } =
      await renderAddressAutocomplete(onChangeValue)
    const input = container.querySelector('input')
    if (!input) {
      throw new Error('Address input was not rendered')
    }

    await search(input, '1 Test')
    const option = container.querySelector(
      '.cypress-autocomplete-dropdown-item',
    )
    if (!option) {
      throw new Error('Address option was not rendered')
    }

    await React.act(async () => {
      option.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      )
    })
    await React.act(async () => {
      blurInput(input)
    })

    expect(onChangeValue).toHaveBeenCalledTimes(1)
    expect(onChangeValue).toHaveBeenCalledWith('address-1')
    unmount()
  })

  test('blurring an exact typed match still selects that option', async () => {
    const onChangeValue = vi.fn()
    const { container, unmount } =
      await renderAddressAutocomplete(onChangeValue)
    const input = container.querySelector('input')
    if (!input) {
      throw new Error('Address input was not rendered')
    }

    await search(input, '1 Test Street')
    await React.act(async () => {
      blurInput(input)
    })

    expect(onChangeValue).toHaveBeenCalledTimes(1)
    expect(onChangeValue).toHaveBeenCalledWith('address-1')
    unmount()
  })

  test('blurring a different exact match selects the new option', async () => {
    const onChangeValue = vi.fn()
    const { container, unmount } =
      await renderAddressAutocomplete(onChangeValue)
    const input = container.querySelector('input')
    if (!input) {
      throw new Error('Address input was not rendered')
    }

    await search(input, '1 Test')
    const option = container.querySelector(
      '.cypress-autocomplete-dropdown-item',
    )
    if (!option) {
      throw new Error('Address option was not rendered')
    }
    await React.act(async () => {
      option.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
      )
    })

    await search(input, '2 Test Street')
    await React.act(async () => {
      blurInput(input)
    })

    expect(onChangeValue).toHaveBeenCalledTimes(2)
    expect(onChangeValue).toHaveBeenNthCalledWith(1, 'address-1')
    expect(onChangeValue).toHaveBeenNthCalledWith(2, 'address-2')
    unmount()
  })
})
