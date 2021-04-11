import * as React from 'react'
import Flatpickr from 'flatpickr'
import { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance'

export { FlatpickrOptions }

export default function useFlatpickr(
  {
    id,
    value,
    onChange,
  }: {
    id: string
    value: unknown | undefined
    onChange: (value: string | undefined) => void
  },
  fpOpts: FlatpickrOptions,
  htmlElement: { current: HTMLElement | null },
) {
  const vpRef = React.useRef<FlatpickrInstance | null>(null)

  React.useEffect(() => {
    const options: FlatpickrOptions = {
      ...fpOpts,
      static: true,
      appendTo: htmlElement.current || undefined,
    }
    const newVp: FlatpickrInstance = new (Flatpickr as any)(
      `[id="${id}"]`,
      options,
    )
    vpRef.current = newVp
    return () => {
      // destroy the flatpickr instance when the dom element is removed
      vpRef.current = null
      if (newVp.destroy) {
        newVp.destroy()
      }
    }
  }, [fpOpts, htmlElement, id, vpRef])

  React.useEffect(() => {
    if (vpRef.current && vpRef.current.config) {
      vpRef.current.set('onChange', (selectedDates: Date[]) => {
        onChange(selectedDates[0] && selectedDates[0].toISOString())
      })
    }
  }, [onChange, vpRef])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    const vp = vpRef.current

    if (vp && vp.selectedDates) {
      const selectedDate = vp.selectedDates[0]

      if (!value && selectedDate) {
        vp.clear(false)
      } else if (
        value &&
        typeof value === 'string' &&
        (!selectedDate || selectedDate.toISOString() !== value)
      ) {
        vp.setDate(value, false)
      }
    }
  }, [value, vpRef])
}
