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
    onChange,
  } /* : {
    id: string,
    value: mixed | void,
    onChange: (string | void) => void,
  } */,
  fpOpts /* : mixed */,
) {
  const vpRef = React.useRef(null)

  React.useEffect(() => {
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
    if (vpRef.current && vpRef.current.config) {
      vpRef.current.set('onChange', (selectedDates) =>
        onChange(selectedDates[0] && selectedDates[0].toISOString()),
      )
    }
  }, [onChange, vpRef])

  // Sync value with flatpickr when value is changed outside of component
  React.useEffect(() => {
    const vp = vpRef.current
    if (vp && vp.selectedDates) {
      if (!value && vp.selectedDates[0]) {
        vp.setDate(undefined, false)
      } else if (value && !vp.selectedDates[0]) {
        vp.setDate(value, false)
      } else if (
        vp.selectedDates[0] &&
        value &&
        vp.selectedDates[0].toISOString() !== value
      ) {
        vp.setDate(value, false)
      }
    }
  }, [value, vpRef])
}
