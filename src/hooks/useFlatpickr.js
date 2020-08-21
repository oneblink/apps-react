// @flow
'use strict'

import * as React from 'react'
import Flatpickr from 'flatpickr'
// $FlowFixMe
import 'flatpickr/dist/flatpickr.css'

export default function useFlatpickr(
  {
    id,
    value,
    isDisabled,
    onBlur,
    onChange,
  } /* : {
    id: string,
    value: mixed | void,
    isDisabled: boolean,
    onBlur: () => void,
    onChange: (string | void) => void,
  } */,
  fpOpts /* : {
    dateFormat: string,
    altFormat: string,
    altInput: boolean,
    allowInput: boolean,
  } */,
) {
  const [vp, setVp] = React.useState(null)

  React.useEffect(() => {
    const newVp = new Flatpickr(`#${id}`, fpOpts)
    setVp(newVp)
    return () => {
      // destroy the flatpickr instance when the dom element is removed
      newVp.destroy()
    }
  }, [fpOpts, id])

  React.useEffect(() => {
    if (vp && vp.config) {
      vp.set('onChange', (selectedDates) =>
        onChange(selectedDates[0] && selectedDates[0].toISOString()),
      )
    }
  }, [onChange, vp])

  // Due to this bug: https://github.com/flatpickr/flatpickr/issues/831
  // Observe changes to disabled attribute if using ngDisabled
  React.useEffect(() => {
    if (
      vp &&
      vp.input &&
      vp.input.parentElement &&
      vp.input.parentElement.children[1]
    ) {
      vp.input.parentElement.children[1].disabled = isDisabled
    }
  }, [isDisabled, vp])

  //
  // The following functions were copied from the flatpickr library
  // to allow use to set a date in that is invalid (e.g. outside of min.max)
  // and display validation errors instead of the default behaviour of
  // the library which is to clear in the input if an invalid date is set.
  //
  // Issue is being tracked here: https://github.com/flatpickr/flatpickr/issues/1224
  //
  const createEvent = React.useCallback((name) => {
    const e = document.createEvent('Event')
    e.initEvent(name, true, true)
    return e
  }, [])

  const triggerEvent = React.useCallback(
    (event, data) => {
      // If the instance has been destroyed already, all hooks have been removed
      if (!vp || vp.config === undefined) return

      const hooks = vp.config[event]

      if (hooks !== undefined && hooks.length > 0) {
        for (let i = 0; hooks[i] && i < hooks.length; i++) {
          hooks[i](vp.selectedDates, vp.input.value, vp, data)
        }
      }

      if (event === 'onChange') {
        vp.input.dispatchEvent(createEvent('change'))

        // many front-end frameworks bind to the input event
        vp.input.dispatchEvent(createEvent('input'))
      }
    },
    [createEvent, vp],
  )

  const getDateStr = React.useCallback(
    (format) => {
      if (vp) {
        return vp.selectedDates
          .map((dObj) => vp.formatDate(dObj, format))
          .filter(
            (d, i, arr) =>
              vp.config.mode !== 'range' ||
              vp.config.enableTime ||
              arr.indexOf(d) === i,
          )
          .join(
            vp.config.mode !== 'range'
              ? vp.config.conjunction
              : vp.l10n.rangeSeparator,
          )
      }
    },
    [vp],
  )

  /**
   * Updates the values of inputs associated with the calendar
   */
  const updateValue = React.useCallback(
    (triggerChange = true) => {
      if (vp) {
        if (vp.mobileInput !== undefined && vp.mobileFormatStr) {
          vp.mobileInput.value =
            vp.latestSelectedDateObj !== undefined
              ? vp.formatDate(vp.latestSelectedDateObj, vp.mobileFormatStr)
              : ''
        }

        vp.input.value = getDateStr(vp.config.dateFormat)

        if (vp.altInput !== undefined) {
          vp.altInput.value = getDateStr(vp.config.altFormat)
        }

        if (triggerChange !== false) triggerEvent('onValueUpdate')
      }
    },
    [getDateStr, triggerEvent, vp],
  )

  const setDate = React.useCallback(
    (date, triggerChange) => {
      if (vp) {
        if (
          (date !== 0 && !date) ||
          (date instanceof Array && date.length === 0)
        ) {
          return vp.clear(triggerChange)
        }

        vp.selectedDates = [vp.parseDate(date)]

        vp.showTimeInput = vp.selectedDates.length > 0
        vp.latestSelectedDateObj = vp.selectedDates[0]

        vp.redraw()
        vp.jumpToDate()

        vp._setHoursFromDate()

        updateValue(triggerChange)

        if (triggerChange) {
          triggerEvent('onChange')
        }
      }
    },
    [triggerEvent, updateValue, vp],
  )

  // Custom blur listener to allow dates to be typed in and set
  // without having to press the "Enter" key, courtesy of this guy:
  // https://github.com/flatpickr/flatpickr/issues/1551#issuecomment-646679246
  React.useEffect(() => {
    if (vp) {
      if (fpOpts.allowInput) {
        // $FlowFixMe
        const input /* : HTMLInputElement | null */ = fpOpts.altInput
          ? vp.altInput
          : vp.input

        if (input) {
          const format = fpOpts.altInput ? fpOpts.altFormat : fpOpts.dateFormat
          const onBlurListener = (e /* : FocusEvent */) => {
            onBlur()

            // $FlowFixMe
            const date = Flatpickr.parseDate(e.target.value, format)
            if (date) {
              setDate(date, true)
            } else {
              vp.clear()
            }
          }

          input.addEventListener('blur', onBlurListener)

          return () => {
            input.removeEventListener('blur', onBlurListener)
          }
        }
      }
    }
  }, [
    setDate,
    fpOpts.allowInput,
    fpOpts.altFormat,
    fpOpts.altInput,
    fpOpts.dateFormat,
    vp,
    onBlur,
  ])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    if (vp) {
      if (!value && vp.selectedDates[0]) {
        setDate(undefined, false)
      } else if (value && !vp.selectedDates[0]) {
        setDate(value, false)
      } else if (
        vp.selectedDates[0] &&
        value &&
        vp.selectedDates[0].toISOString() !== value
      ) {
        setDate(value, false)
      }
    }
  }, [setDate, value, vp])
}
