import * as React from 'react'
import Flatpickr from 'flatpickr'
import { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'

export default function useFlatpickr(
  {
    id,
    value,
    onChange,
  }: {
    id: string
    value: unknown | void
    onChange: (value: string | void) => void
  },
  fpOpts: FlatpickrOptions,
) {
  const vpRef = React.useRef(null)

  React.useEffect(() => {
    // @ts-expect-error
    const newVp = new Flatpickr(`[id="${id}"]`, fpOpts)
    vpRef.current = newVp
    return () => {
      // destroy the flatpickr instance when the dom element is removed
      if (newVp && newVp.destroy) {
        newVp.destroy()
      }
    }
  }, [fpOpts, id, vpRef])

  React.useEffect(() => {
    // @ts-expect-error
    if (vpRef.current && vpRef.current.config) {
      // @ts-expect-error
      vpRef.current.set('onChange', (selectedDates) =>
        onChange(selectedDates[0] && selectedDates[0].toISOString()),
      )
    }
  }, [onChange, vpRef])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    const vp = vpRef.current
    // @ts-expect-error
    if (vp && vp.selectedDates) {
      // @ts-expect-error
      if (!value && vp.selectedDates[0]) {
        // @ts-expect-error
        vp.setDate(undefined, false)
        // @ts-expect-error
      } else if (value && !vp.selectedDates[0]) {
        // @ts-expect-error
        vp.setDate(value, false)
      } else if (
        // @ts-expect-error
        vp.selectedDates[0] &&
        value &&
        // @ts-expect-error
        vp.selectedDates[0].toISOString() !== value
      ) {
        // @ts-expect-error
        vp.setDate(value, false)
      }
    }
  }, [value, vpRef])
}
