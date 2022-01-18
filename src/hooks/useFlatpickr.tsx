import * as React from 'react'
import Flatpickr from 'flatpickr'
import { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance'
import { Sentry } from '@oneblink/apps'
import useFlatpickrGuid from '../hooks/useFlatpickrGuid'

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
  const flatpickrGuid = useFlatpickrGuid()
  const vpRef = React.useRef<FlatpickrInstance | null>(null)

  const getDateValue = React.useCallback(
    (date: Date | undefined) => {
      if (!date) return
      if (dateOnly) {
        return vpRef.current?.formatDate(date, 'Y-m-d')
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
      `[id="${flatpickrGuid}"] [id="${id}"]`,
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
  }, [flatpickrGuid, fpOpts, htmlElement, id, vpRef])

  React.useEffect(() => {
    if (vpRef.current && vpRef.current.config) {
      vpRef.current.set('onChange', (selectedDates: Date[]) => {
        onChange(getDateValue(selectedDates[0]))
      })
    }
  }, [getDateValue, onChange, vpRef])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    // try {
    const vp = vpRef.current

    if (vp && vp.selectedDates) {
      const selectedDate = vp.selectedDates[0]
      // Sentry.captureException(
      //   new Error(`selectedDate: ${selectedDate} value: ${value}`),
      // )
      if (!value && selectedDate) {
        try {
          vp.clear(false)
        } catch (error) {
          Sentry.captureException(new Error('Error clearing value'))
        }
      } else if (
        value &&
        typeof value === 'string' &&
        (!selectedDate || getDateValue(selectedDate) !== value)
      ) {
        try {
          vp.setDate(value, false)
          // vp.setDate('2021-10-07', false)
        } catch (error) {
          Sentry.captureException(new Error(`Error setting date: ${value}`))
        }
      }
    }
    // } catch (error) {
    //   Sentry.captureException(error)
    // }
  }, [getDateValue, value, vpRef])
}
