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
    dateOnly,
  }: {
    id: string
    value: unknown | undefined
    onChange: (value: string | undefined) => void
    dateOnly?: boolean
  },
  fpOpts: FlatpickrOptions,
  htmlElement: { current: HTMLElement | null },
) {
  const vpRef = React.useRef<FlatpickrInstance | null>(null)

  const getDateValue = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return
      if (dateOnly) {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      return date.toISOString()
    },
    [dateOnly],
  )

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
        onChange(getDateValue(selectedDates[0]))
      })
    }
  }, [getDateValue, onChange, vpRef])

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
        (!selectedDate || getDateValue(selectedDate) !== value)
      ) {
        vp.setDate(value, false)
      }
    }
  }, [getDateValue, value, vpRef])
}
