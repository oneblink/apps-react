import * as React from 'react'
import Flatpickr from 'flatpickr'
import { Options as FlatpickrOptions } from 'flatpickr/dist/types/options'
import { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance'
import { Sentry, localisationService } from '@oneblink/apps'
import useFlatpickrGuid from '../hooks/useFlatpickrGuid'

export { FlatpickrOptions }

const getDateValue = (
  date: Date | undefined,
  dateOnly: boolean | undefined,
) => {
  if (!date) return
  if (dateOnly) {
    return Flatpickr.formatDate(date, 'Y-m-d')
  }
  return date.toISOString()
}

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

  React.useEffect(() => {
    const options: FlatpickrOptions = {
      ...fpOpts,
      static: true,
      appendTo: htmlElement.current || undefined,
      formatDate: (date: Date | undefined, format: string) => {
        if (date) {
          return Flatpickr.formatDate(date, format)
        }
        return ''
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newVp: FlatpickrInstance = new (Flatpickr as any)(
      `[id="${flatpickrGuid}"] [id="${id}"]`,
      options,
    )
    newVp.set('onChange', (selectedDates: Date[]) => {
      onChange(getDateValue(selectedDates?.[0], dateOnly))
    })
    // Have to update the value in an onClose event if time is
    // enabled as changing the AM/PM via keyboard does not
    // trigger the onChange event:
    // https://github.com/flatpickr/flatpickr/issues/1957
    if (fpOpts.enableTime) {
      newVp.set('onClose', (selectedDates: Date[]) => {
        onChange(getDateValue(selectedDates?.[0], dateOnly))
      })
    }
    vpRef.current = newVp
    return () => {
      // destroy the flatpickr instance when the dom element is removed
      vpRef.current = null
      if (newVp.destroy) {
        newVp.destroy()
      }
    }
  }, [dateOnly, flatpickrGuid, fpOpts, htmlElement, id, onChange])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    const vp = vpRef.current

    if (vp && vp.selectedDates) {
      const selectedDate = vp.selectedDates[0]
      if (!value && selectedDate) {
        try {
          vp.clear(false)
        } catch (error) {
          Sentry.captureException(new Error('Error clearing value'))
        }
      } else if (
        value &&
        typeof value === 'string' &&
        (!selectedDate || getDateValue(selectedDate, dateOnly) !== value)
      ) {
        try {
          const date = localisationService.generateDate({
            daysOffset: undefined,
            value,
            dateOnly: !!dateOnly,
          })
          if (date) {
            vp.setDate(date, false)
          }
        } catch (error) {
          Sentry.captureException(new Error(`Error setting date: ${value}`))
        }
      }
    }
  }, [dateOnly, value])

  const onBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement, Element>) => {
      if (e.target.value) {
        try {
          const date = Flatpickr.parseDate(e.target.value, fpOpts.dateFormat)
          if (date) {
            const newValue = getDateValue(date, dateOnly)
            onChange(newValue)
            return
          }
        } catch (e) {
          console.warn('Could not parse date on blur event', id, e)
        }
      }
      onChange(undefined)
    },
    [dateOnly, fpOpts.dateFormat, id, onChange],
  )

  return {
    onBlur,
  }
}
